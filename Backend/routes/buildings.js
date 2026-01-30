const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM buildings");
    res.json(results);
  } catch (err) {
    console.error("Buildings error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
