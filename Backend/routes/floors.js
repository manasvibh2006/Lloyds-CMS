const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { buildingId } = req.query;
    const [results] = await db.query(
      "SELECT * FROM floors WHERE building_id = ?",
      [buildingId]
    );
    res.json(results);
  } catch (err) {
    console.error("Floors error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
