const express = require("express");
const router = express.Router();
const db = require("../db"); 

// GET all allocations
router.get("/", async (req, res) => {
  console.log("📡 Fetching allocations...");
  
  try {
    // First check if allocations table exists and has data
    const [countResult] = await db.query("SELECT COUNT(*) as count FROM allocations");
    
    const count = countResult[0].count;
    console.log(`📊 Total allocations in DB: ${count}`);
    
    if (count === 0) {
      console.log("⚠️ No allocations found, returning empty array");
      return res.json([]);
    }
    
    // Get all buildings ordered by ID to calculate sequential building numbers
    const [buildings] = await db.query("SELECT id FROM buildings ORDER BY id ASC");
    const buildingNumberMap = {};
    buildings.forEach((building, index) => {
      buildingNumberMap[building.id] = index + 1;
    });
    
    // Fetch with joins - simplified query
    const [results] = await db.query(`
      SELECT 
        a.id,
        a.user_id as userId,
        a.user_name as userName,
        a.company,
        a.contractor_name as contractorName,
        a.remarks,
        a.status,
        a.allocated_at as created_at,
        a.start_date,
        a.end_date,
        a.bed_id,
        b.bed_number,
        r.room_number,
        f.floor_number,
        f.id as floorId,
        bld.id as buildingId,
        bld.name as buildingName
      FROM allocations a
      JOIN beds b ON a.bed_id = b.id
      JOIN rooms r ON b.room_id = r.id
      JOIN floors f ON r.floor_id = f.id
      JOIN buildings bld ON f.building_id = bld.id
      ORDER BY a.allocated_at DESC
    `);
    
    // Add sequential building number to each result
    const resultsWithBuildingNum = results.map(allocation => ({
      ...allocation,
      buildingNumber: buildingNumberMap[allocation.buildingId]
    }));
    
    console.log(`✅ Found ${results.length} allocations`);
    res.json(resultsWithBuildingNum);
  } catch (err) {
    console.error("❌ Error checking allocations table:", err.message);
    // Table might not exist, return empty array
    return res.json([]);
  }
});

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
    startDate,
    endDate,
    remarks
  } = req.body;

  if (!userId || !userName || !company || !bedId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check bed availability and insert in one go
    await db.query(
      `INSERT INTO allocations
       (user_id, user_name, company, bed_id, contractor_name, remarks, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'BOOKED')`,
      [userId, userName, company, bedId, contractorName || 'N/A', remarks || null, startDate || null, endDate || null]
    );

    // Update bed status
    await db.query(
      "UPDATE beds SET status = 'BOOKED' WHERE id = ?",
      [bedId]
    );
    
    res.json({ message: "Allocation successful" });
  } catch (err) {
    console.error("❌ Allocation error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE - Unbook allocation and release bed
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { bedId } = req.query;

  try {
    // Update bed status to AVAILABLE
    await db.query("UPDATE beds SET status = 'AVAILABLE' WHERE id = ?", [bedId]);

    // Delete the allocation record
    await db.query("DELETE FROM allocations WHERE id = ?", [id]);
    
    res.json({ success: true, message: "Bed unbooked successfully" });
  } catch (err) {
    console.error("Error unbooking allocation:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;