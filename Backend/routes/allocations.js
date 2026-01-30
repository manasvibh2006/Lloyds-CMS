const express = require("express");
const router = express.Router();
const db = require("../db"); 

// CREATE ALLOCATION
router.post("/", async (req, res) => {
  console.log("🔥 ALLOCATION API HIT 🔥");
  console.log("REQ BODY:", req.body);

  const {
    userId,
    userName,
    company,
    contractorName,
    bedId,
    remarks
  } = req.body;

  if (!userId || !userName || !company || !bedId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Create user if not exists
    const [existingUser] = await conn.query(
      "SELECT id FROM users WHERE user_id = ?",
      [userId]
    );

    let userDbId;

    if (existingUser.length === 0) {
      const [userResult] = await conn.query(
        `INSERT INTO users 
         (user_id, name, company, role, password_hash)
         VALUES (?, ?, ?, 'CONTRACTOR', 'N/A')`,
        [userId, userName, company]
      );
      userDbId = userResult.insertId;
    } else {
      userDbId = existingUser[0].id;
    }

    // 2️⃣ Check bed availability
    const [bedRows] = await conn.query(
      "SELECT is_available FROM beds WHERE id = ? FOR UPDATE",
      [bedId]
    );

    if (bedRows.length === 0 || bedRows[0].is_available === 0) {
      throw new Error("Bed is already booked");
    }

    // 3️⃣ Insert allocation
    await conn.query(
      `INSERT INTO allocations
       (user_id, bed_id, contractor_name, remarks, status)
       VALUES (?, ?, ?, ?, 'BOOKED')`,
      [userDbId, bedId, contractorName || null, remarks || null]
    );

    // 4️⃣ Mark bed unavailable
    await conn.query(
      "UPDATE beds SET is_available = 0, status = 'BOOKED' WHERE id = ?",
      [bedId]
    );

    await conn.commit();

    res.json({ message: "Allocation successful" });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Allocation error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
