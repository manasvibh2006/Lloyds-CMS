const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { floorId } = req.query;
    const [results] = await db.query(
      "SELECT * FROM rooms WHERE floor_id = ?",
      [floorId]
    );
    res.json(results);
  } catch (err) {
    console.error("Rooms error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
