const express = require("express");
const db = require("../db");
const router = express.Router();

// List buildings (optionally only active)
router.get("/", (req, res) => {
  const onlyActive = req.query.active === "true";
  const sql = onlyActive ? "SELECT * FROM buildings WHERE is_active = 1" : "SELECT * FROM buildings";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Create building
router.post("/", (req, res) => {
  const { name, address } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  db.query(
    "INSERT INTO buildings (name, address) VALUES (?, ?)",
    [name, address || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, name, address: address || null, is_active: 1 });
    }
  );
});

// Soft deactivate a building
router.patch("/:id/deactivate", (req, res) => {
  db.query("UPDATE buildings SET is_active = 0 WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: result.affectedRows > 0 });
  });
});

// Reactivate a building
router.patch("/:id/activate", (req, res) => {
  db.query("UPDATE buildings SET is_active = 1 WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: result.affectedRows > 0 });
  });
});

module.exports = router;