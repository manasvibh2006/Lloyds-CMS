const express = require("express");
const db = require("../db");

const router = express.Router();

/**
 * GET /rooms?floorId=...
 * Fetch all rooms for a given floor
 */
router.get("/", async (req, res) => {
  const { floorId } = req.query;

  if (!floorId) {
    return res.status(400).json({ error: "floorId is required as query param" });
  }

  console.log("📡 Fetching rooms for floor:", floorId);

  try {
    const [results] = await db.query(
      `SELECT
        r.*,
        COUNT(b.id) AS total_beds,
        COALESCE(SUM(CASE WHEN b.status = 'AVAILABLE' THEN 1 ELSE 0 END), 0) AS vacant_beds,
        (
          COUNT(b.id) -
          COALESCE(SUM(CASE WHEN b.status = 'AVAILABLE' THEN 1 ELSE 0 END), 0)
        ) AS occupied_beds
      FROM rooms r
      LEFT JOIN beds b ON b.room_id = r.id
      WHERE r.floor_id = ?
      GROUP BY r.id
      ORDER BY CAST(r.room_number AS UNSIGNED) ASC, r.room_number ASC`,
      [floorId]
    );

    // Format room numbers for UI (01, 02, 10, etc.)
    const formattedRooms = results.map(room => ({
      ...room,
      display_room_number: room.room_number
        .toString()
        .padStart(2, "0")
    }));

    console.log(`✅ Found ${results.length} rooms`);
    res.json(formattedRooms);

  } catch (err) {
    console.error("❌ Rooms GET error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /rooms
 * Create a new room — BACKEND generates room number
 * Body: { floorId }
 */
router.post("/", async (req, res) => {
  const { floorId } = req.body;

  if (!floorId) {
    return res.status(400).json({ error: "floorId is required" });
  }

  try {
    // Pick the lowest available room number from 1..99 for this floor.
    const [rows] = await db.query(
      "SELECT CAST(room_number AS UNSIGNED) AS room_number FROM rooms WHERE floor_id = ?",
      [floorId]
    );

    const used = new Set(
      rows
        .map((row) => Number.parseInt(row.room_number, 10))
        .filter((n) => Number.isInteger(n) && n > 0 && n <= 99)
    );
    let newRoomNumber = null;
    for (let candidate = 1; candidate <= 99; candidate++) {
      if (!used.has(candidate)) {
        newRoomNumber = candidate;
        break;
      }
    }

    if (!newRoomNumber) {
      return res.status(400).json({ error: "No room numbers available (max 99)" });
    }

    // Insert new room
    const [result] = await db.query(
      "INSERT INTO rooms (floor_id, room_number) VALUES (?, ?)",
      [floorId, newRoomNumber]
    );

    res.status(201).json({
      id: result.insertId,
      floor_id: floorId,
      room_number: newRoomNumber, // stored as integer
      display_room_number: newRoomNumber.toString().padStart(2, "0")
    });

  } catch (err) {
    console.error("❌ Room creation error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
