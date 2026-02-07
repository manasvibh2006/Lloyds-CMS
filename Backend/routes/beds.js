const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  const { roomId } = req.query;
  console.log("🛏️ Fetching beds for room ID:", roomId);
  
  if (!roomId) {
    return res.status(400).json({ error: "Room ID is required" });
  }
  
  try {
    const [results] = await db.query(
      "SELECT * FROM beds WHERE room_id = ? ORDER BY bed_number",
      [roomId]
    );
    console.log(`📊Found beds: ${results.length} (Available: ${results.filter(b => b.status === 'AVAILABLE').length}, Booked: ${results.filter(b => b.status === 'BOOKED').length})`);
    res.json(results);
  } catch (err) {
    console.error("❌ Beds error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Create bed
router.post("/", async (req, res) => {
  const { roomId, bedNumber, status } = req.body;
  if (!roomId || bedNumber == null) {
    return res.status(400).json({ error: "roomId and bedNumber are required" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO beds (room_id, bed_number, status) VALUES (?, ?, ?)",
      [roomId, bedNumber, status || "AVAILABLE"]
    );
    res.status(201).json({ id: result.insertId, room_id: roomId, bed_number: bedNumber, status: status || "AVAILABLE" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
