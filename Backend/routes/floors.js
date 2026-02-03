const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const { buildingId } = req.query;
  console.log("📡 Fetching floors for building:", buildingId);
  
  db.query(
    "SELECT * FROM floors WHERE building_id = ?",
    [buildingId],
    (err, results) => {
      if (err) {
        console.error("❌ Floors error:", err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`✅ Found ${results.length} floors`);
      res.json(results);
    }
  );
});

// Create floor
router.post("/", (req, res) => {
  const { buildingId, floorNumber, name } = req.body;
  if (!buildingId || floorNumber == null || !name) {
    return res.status(400).json({ error: "buildingId, floorNumber, and name are required" });
  }

  db.query(
    "INSERT INTO floors (building_id, name, floor_number) VALUES (?, ?, ?)",
    [buildingId, name, floorNumber],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, building_id: buildingId, name, floor_number: floorNumber });
    }
  );
});

module.exports = router;
