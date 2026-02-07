const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  const { floorId } = req.query;
  console.log("📡 Fetching rooms for floor:", floorId);
  
  try {
    const [results] = await db.query(
      "SELECT * FROM rooms WHERE floor_id = ?",
      [floorId]
    );
    console.log(`✅ Found ${results.length} rooms`);
    res.json(results);
  } catch (err) {
    console.error("❌ Rooms error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Create room
router.post("/", async (req, res) => {
  const { floorId, roomNumber } = req.body;
  if (!floorId || !roomNumber) {
    return res.status(400).json({ error: "floorId and roomNumber are required" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO rooms (floor_id, room_number) VALUES (?, ?)",
      [floorId, roomNumber]
    );
    res.status(201).json({ id: result.insertId, floor_id: floorId, room_number: roomNumber });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
