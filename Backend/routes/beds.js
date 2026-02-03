const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const { roomId } = req.query;
  console.log("🛏️ Fetching beds for room ID:", roomId);
  
  if (!roomId) {
    return res.status(400).json({ error: "Room ID is required" });
  }
  
  db.query(
    "SELECT * FROM beds WHERE room_id = ? ORDER BY bunk_number, position",
    [roomId],
    (err, results) => {
      if (err) {
        console.error("❌ Beds error:", err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`📊Found beds: ${results.length} (Available: ${results.filter(b => b.status === 'AVAILABLE').length}, Booked: ${results.filter(b => b.status === 'BOOKED').length})`);
      res.json(results);
    }
  );
});

// Create bed
router.post("/", (req, res) => {
  const { roomId, bunkNumber, position, status } = req.body;
  if (!roomId || bunkNumber == null || !position) {
    return res.status(400).json({ error: "roomId, bunkNumber, position are required" });
  }

  db.query(
    "INSERT INTO beds (room_id, bunk_number, position, status) VALUES (?, ?, ?, ?)",
    [roomId, bunkNumber, position, status || "AVAILABLE"],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, room_id: roomId, bunk_number: bunkNumber, position, status: status || "AVAILABLE" });
    }
  );
});

module.exports = router;
