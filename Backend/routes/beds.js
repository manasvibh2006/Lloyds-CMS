const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { roomId } = req.query;
    const [results] = await db.query(
      "SELECT * FROM beds WHERE room_id = ?",
      [roomId]
    );
    res.json(results);
  } catch (err) {
    console.error("Beds error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
