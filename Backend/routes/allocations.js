const express = require("express");
const router = express.Router();
const db = require("../db");

console.log("📂 Loading allocations.js routes...");

/**
 * Generate 6-digit allocation code: BFRRBB
 * B = Sequential building number (1st, 2nd, 3rd by creation order)
 * F = Floor number (1 digit)
 * RR = Room number (2 digits, zero-padded)
 * BB = Bed number (2 digits, zero-padded)
 */
async function generateAllocationCode(bedId) {
  // Get active buildings in creation order
  const [buildings] = await db.query(`
    SELECT id 
    FROM buildings 
    WHERE is_active = 1 
    ORDER BY id ASC
  `);

  // Map building_id → sequential number
  const buildingNumberMap = {};
  buildings.forEach((b, i) => {
    buildingNumberMap[b.id] = i + 1;
  });

  // Get bed → room → floor → building details
  const [rows] = await db.query(`
    SELECT 
      bld.id AS building_id,
      f.floor_number,
      r.room_number,
      b.bed_number
    FROM beds b
    JOIN rooms r ON b.room_id = r.id
    JOIN floors f ON r.floor_id = f.id
    JOIN buildings bld ON f.building_id = bld.id
    WHERE b.id = ?
  `, [bedId]);

  if (rows.length === 0) {
    throw new Error(`Bed ${bedId} not found`);
  }

  const { building_id, floor_number, room_number, bed_number } = rows[0];

  const B = buildingNumberMap[building_id].toString();      // 1 digit
  const F = floor_number.toString();                        // 1 digit
  const RR = room_number.toString().padStart(2, "0");       // 2 digits
  const BB = bed_number.toString().padStart(2, "0");        // 2 digits

  return `${B}${F}${RR}${BB}`; // e.g. 216004
}

/* ---------------------------------------------------
   GET ALL ALLOCATIONS
--------------------------------------------------- */
// GET all allocations (FINAL, WORKING VERSION)
router.get("/", async (req, res) => {
  console.log("📡 Fetching allocations...");

  try {
    const [results] = await db.query(`
      SELECT 
        a.id,
        a.user_id AS userId,
        u.name AS userName,
        u.company,
        a.contractor_name AS contractorName,
        a.start_date,
        a.end_date,
        a.remarks,
        a.status,
        a.allocated_at AS created_at,
        a.bed_id,
        a.allocation_code,
        b.bed_number,
        r.room_number,
        f.floor_number,
        bld.id AS buildingId,
        bld.name AS buildingName
      FROM allocations a
      JOIN users u ON a.user_id = u.user_id
      JOIN beds b ON a.bed_id = b.id
      JOIN rooms r ON b.room_id = r.id
      JOIN floors f ON r.floor_id = f.id
      JOIN buildings bld ON f.building_id = bld.id
      ORDER BY a.allocated_at DESC
    `);

    console.log(`✅ Found ${results.length} allocations`);
    res.json(results);

  } catch (err) {
    console.error("❌ Error fetching allocations:", err);
    res.status(500).json({ error: err.message });
  }
});
/* ---------------------------------------------------
   CREATE ALLOCATION
--------------------------------------------------- */
router.post("/", async (req, res) => {
  console.log("🔥 ALLOCATION API HIT 🔥");
  console.log("REQ BODY:", req.body);

  const {
    userId,
    userName,
    company,
    contractorName,
    bedId,
    startDate,
    endDate,
    remarks
  } = req.body;

  if (!userId || !bedId) {
    return res.status(400).json({ error: "userId and bedId are required" });
  }

  try {
    const [blacklisted] = await db.query(
      "SELECT reason FROM blacklist WHERE user_id = ? AND is_active = TRUE LIMIT 1",
      [userId]
    );

    if (blacklisted.length > 0) {
      return res.status(403).json({
        error: `User is blacklisted. Reason: ${blacklisted[0].reason || "-"}`
      });
    }

    // Ensure user exists for fk_allocations_users before inserting allocation.
    await db.query(
      `INSERT INTO users (user_id, name, company, role, password_hash)
       VALUES (?, ?, ?, 'CONTRACTOR', 'N/A')
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         company = VALUES(company)`,
      [
        userId,
        (userName && userName.trim()) || userId,
        (company && company.trim()) || ""
      ]
    );

    // Generate allocation code FIRST
    const allocationCode = await generateAllocationCode(bedId);
    console.log(`📟 Generated allocation code: ${allocationCode}`);

    // Insert allocation (normalized — no user_name/company here)
    const [result] = await db.query(
      `INSERT INTO allocations
       (user_id, bed_id, contractor_name, remarks, start_date, end_date, status, allocation_code)
       VALUES (?, ?, ?, ?, ?, ?, 'BOOKED', ?)`,
      [
        userId,
        bedId,
        contractorName || "N/A",
        remarks || null,
        startDate || null,
        endDate || null,
        allocationCode
      ]
    );

    // Mark bed as booked
    await db.query(
      "UPDATE beds SET status = 'BOOKED' WHERE id = ?",
      [bedId]
    );

    res.json({
      message: "Allocation successful",
      allocation_code: allocationCode,
      allocation_id: result.insertId
    });

  } catch (err) {
    console.error("❌ Allocation error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* ---------------------------------------------------
   UPDATE ALLOCATION (PUT)
--------------------------------------------------- */
router.put("/:id", async (req, res) => {
  console.log("🎯 PUT ROUTE HIT! Allocation ID:", req.params.id);

  const { id } = req.params;
  const {
    userName,
    company,
    contractorName,
    startDate,
    endDate,
    remarks,
    checkout
  } = req.body;

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({ error: "End date must be after start date" });
  }

  const shouldCheckout = checkout === true || checkout === "true";
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [allocRows] = await connection.query(
      "SELECT id, user_id, bed_id, status FROM allocations WHERE id = ? LIMIT 1",
      [id]
    );

    if (allocRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Allocation not found" });
    }

    const allocation = allocRows[0];

    if (userName || company) {
      await connection.query(
        `UPDATE users
         SET name = COALESCE(?, name),
             company = COALESCE(?, company)
         WHERE user_id = ?`,
        [
          userName && userName.trim() ? userName.trim() : null,
          company && company.trim() ? company.trim() : null,
          allocation.user_id
        ]
      );
    }

    // Live DB uses ENUM('BOOKED','RELEASED','CANCELLED').
    const nextStatus = shouldCheckout ? "RELEASED" : "BOOKED";

    await connection.query(
      `UPDATE allocations
       SET contractor_name = ?,
           start_date = ?,
           end_date = ?,
           remarks = ?,
           status = ?,
           released_at = ?
       WHERE id = ?`,
      [
        contractorName && contractorName.trim() ? contractorName.trim() : "N/A",
        startDate || null,
        endDate || null,
        remarks || null,
        nextStatus,
        shouldCheckout ? new Date() : null,
        id
      ]
    );

    await connection.query(
      "UPDATE beds SET status = ? WHERE id = ?",
      [shouldCheckout ? "AVAILABLE" : "BOOKED", allocation.bed_id]
    );

    await connection.commit();

    res.json({
      success: true,
      status: nextStatus,
      message: shouldCheckout
        ? "Allocation checked out successfully"
        : "Allocation updated successfully"
    });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Error updating allocation:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

/* ---------------------------------------------------
   GET SINGLE ALLOCATION
--------------------------------------------------- */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("🔍 Fetching allocation #" + id);

  try {
    const [results] = await db.query(
      `SELECT 
        a.id,
        a.user_id AS userId,
        a.contractor_name AS contractorName,
        a.remarks,
        a.status,
        a.allocated_at AS created_at,
        a.start_date,
        a.end_date,
        a.bed_id,
        a.allocation_code,
        b.bed_number,
        r.room_number,
        f.floor_number,
        f.id AS floorId,
        bld.id AS buildingId,
        bld.name AS buildingName
      FROM allocations a
      JOIN beds b ON a.bed_id = b.id
      JOIN rooms r ON b.room_id = r.id
      JOIN floors f ON r.floor_id = f.id
      JOIN buildings bld ON f.building_id = bld.id
      WHERE a.id = ?`,
      [id]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "Allocation not found" });
    }

    const allocation = results[0];

    if (!allocation.allocation_code) {
      allocation.allocation_code = await generateAllocationCode(
        allocation.bed_id
      );

      await db.query(
        "UPDATE allocations SET allocation_code = ? WHERE id = ?",
        [allocation.allocation_code, allocation.id]
      );
    }

    res.json(allocation);

  } catch (err) {
    console.error("❌ Error fetching allocation:", err);
    return res.status(500).json({ error: err.message });
  }
});

console.log(
  "✅ Allocations routes registered: GET /, POST /, PUT /:id, GET /:id"
);

module.exports = router;
