const express = require("express");
const db = require("../db");

const router = express.Router();

/**
 * GET /beds?roomId=...
 * Fetch all beds for a given room
 */
router.get("/", async (req, res) => {
  const { roomId } = req.query;

  if (!roomId) {
    return res.status(400).json({ error: "roomId is required as query param" });
  }

  console.log("📡 Fetching beds for room:", roomId);

  try {
    const [results] = await db.query(
      "SELECT * FROM beds WHERE room_id = ? ORDER BY bed_number ASC",
      [roomId]
    );

    // Format bed numbers for UI (01, 02, etc.)
    const formattedBeds = results.map(bed => ({
      ...bed,
      display_bed_number: bed.bed_number.toString().padStart(2, "0")
    }));

    console.log(`✅ Found ${results.length} beds`);
    res.json(formattedBeds);

  } catch (err) {
    console.error("❌ Beds GET error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /beds
 * Create a new bed — BACKEND generates bed number
 * Body: { roomId }
 */
router.post("/", async (req, res) => {
  const { roomId } = req.body;

  if (!roomId) {
    return res.status(400).json({ error: "roomId is required" });
  }

  try {
    // Get last bed number in this room
    const [rows] = await db.query(
      "SELECT MAX(bed_number) AS maxBed FROM beds WHERE room_id = ?",
      [roomId]
    );

    // Generate next bed number (start from 1 if none exist)
    const newBedNumber = rows[0].maxBed
      ? rows[0].maxBed + 1
      : 1;

    // Insert new bed
    const [result] = await db.query(
      "INSERT INTO beds (room_id, bed_number, status) VALUES (?, ?, 'AVAILABLE')",
      [roomId, newBedNumber]
    );

    res.status(201).json({
      id: result.insertId,
      room_id: roomId,
      bed_number: newBedNumber,               // stored as integer
      display_bed_number: newBedNumber.toString().padStart(2, "0"),
      status: "AVAILABLE"
    });

  } catch (err) {
    console.error("❌ Bed creation error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
