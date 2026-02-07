const express = require("express");
const db = require("../db");
const router = express.Router();

// List buildings (optionally only active)
router.get("/", async (req, res) => {
  const onlyActive = req.query.active === "true";
  const sql = onlyActive ? "SELECT * FROM buildings WHERE is_active = 1" : "SELECT * FROM buildings";
  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Create building
router.post("/", async (req, res) => {
  const { name, address } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const [result] = await db.query(
      "INSERT INTO buildings (name, address) VALUES (?, ?)",
      [name, address || null]
    );
    res.status(201).json({ id: result.insertId, name, address: address || null, is_active: 1 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Soft deactivate a building
router.patch("/:id/deactivate", async (req, res) => {
  try {
    const [result] = await db.query("UPDATE buildings SET is_active = 0 WHERE id = ?", [req.params.id]);
    res.json({ success: result.affectedRows > 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Reactivate a building
router.patch("/:id/activate", async (req, res) => {
  try {
    const [result] = await db.query("UPDATE buildings SET is_active = 1 WHERE id = ?", [req.params.id]);
    res.json({ success: result.affectedRows > 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;