const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const { floorId } = req.query;
  console.log("📡 Fetching rooms for floor:", floorId);
  
  db.query(
    "SELECT * FROM rooms WHERE floor_id = ?",
    [floorId],
    (err, results) => {
      if (err) {
        console.error("❌ Rooms error:", err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`✅ Found ${results.length} rooms`);
      res.json(results);
    }
  );
});

// Create room
router.post("/", (req, res) => {
  const { floorId, roomNumber } = req.body;
  if (!floorId || !roomNumber) {
    return res.status(400).json({ error: "floorId and roomNumber are required" });
  }

  db.query(
    "INSERT INTO rooms (floor_id, room_number) VALUES (?, ?)",
    [floorId, roomNumber],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, floor_id: floorId, room_number: roomNumber });
    }
  );
});

module.exports = router;
