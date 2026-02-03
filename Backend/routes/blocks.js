const express = require("express");
const db = require("../db");
const router = express.Router();

// Get all buildings
router.get("/buildings", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM buildings");
    res.json(results);
  } catch (err) {
    console.error("Buildings error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add building
router.post("/buildings", async (req, res) => {
  try {
    const { buildingName, buildingCode } = req.body;
    const result = await db.query(
      "INSERT INTO buildings (buildingName, buildingCode) VALUES (?, ?)",
      [buildingName, buildingCode]
    );
    res.json({ id: result[0].insertId, buildingName, buildingCode });
  } catch (err) {
    console.error("Error adding building:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete building
router.delete("/buildings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM buildings WHERE id = ?", [id]);
    res.json({ success: true, message: "Building deleted" });
  } catch (err) {
    console.error("Error deleting building:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all rooms
router.get("/rooms", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT r.*, b.buildingName FROM rooms r LEFT JOIN buildings b ON r.buildingId = b.id"
    );
    res.json(results);
  } catch (err) {
    console.error("Rooms error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add room
router.post("/rooms", async (req, res) => {
  try {
    const { roomNumber, building, floor, capacity } = req.body;
    const result = await db.query(
      "INSERT INTO rooms (room_number, buildingId, floorName, capacity) VALUES (?, (SELECT id FROM buildings WHERE buildingName = ?), ?, ?)",
      [roomNumber, building, floor, capacity]
    );
    res.json({ success: true, id: result[0].insertId });
  } catch (err) {
    console.error("Error adding room:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete room
router.delete("/rooms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM rooms WHERE id = ?", [id]);
    res.json({ success: true, message: "Room deleted" });
  } catch (err) {
    console.error("Error deleting room:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all beds
router.get("/beds", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT b.*, bld.buildingName FROM beds b LEFT JOIN buildings bld ON b.buildingId = bld.id"
    );
    res.json(results);
  } catch (err) {
    console.error("Beds error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add bed
router.post("/beds", async (req, res) => {
  try {
    const { bedNumber, room, building, floor } = req.body;
    const result = await db.query(
      "INSERT INTO beds (bunk_number, room_number, buildingId, floorName) VALUES (?, ?, (SELECT id FROM buildings WHERE buildingName = ?), ?)",
      [bedNumber, room, building, floor]
    );
    res.json({ success: true, id: result[0].insertId });
  } catch (err) {
    console.error("Error adding bed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete bed
router.delete("/beds/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM beds WHERE id = ?", [id]);
    res.json({ success: true, message: "Bed deleted" });
  } catch (err) {
    console.error("Error deleting bed:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;