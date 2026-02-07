const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  const { buildingId } = req.query;
  console.log("📡 Fetching floors for building:", buildingId);
  
  try {
    const [results] = await db.query(
      "SELECT * FROM floors WHERE building_id = ?",
      [buildingId]
    );
    console.log(`✅ Found ${results.length} floors`);
    res.json(results);
  } catch (err) {
    console.error("❌ Floors error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Create floor
router.post("/", async (req, res) => {
  const { buildingId, floorNumber, name } = req.body;
  if (!buildingId || floorNumber == null || !name) {
    return res.status(400).json({ error: "buildingId, floorNumber, and name are required" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO floors (building_id, name, floor_number) VALUES (?, ?, ?)",
      [buildingId, name, floorNumber]
    );
    res.status(201).json({ id: result.insertId, building_id: buildingId, name, floor_number: floorNumber });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
