const express = require("express");
const db = require("../db");
const router = express.Router();

// Get all buildings
router.get("/buildings", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        b.id, 
        b.name as buildingName, 
        b.address as buildingCode,
        COUNT(DISTINCT f.id) as floors
      FROM buildings b
      LEFT JOIN floors f ON b.id = f.building_id
      GROUP BY b.id, b.name, b.address
    `);
    res.json(results);
  } catch (err) {
    console.error("Buildings error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get floors for a specific building
router.get("/floors/:buildingName", async (req, res) => {
  try {
    const { buildingName } = req.params;
    const [floors] = await db.query(`
      SELECT DISTINCT f.floor_number 
      FROM floors f
      JOIN buildings b ON f.building_id = b.id
      WHERE b.name = ?
      ORDER BY f.floor_number
    `, [buildingName]);
    res.json(floors.map(f => f.floor_number));
  } catch (err) {
    console.error("Floors error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add building
router.post("/buildings", async (req, res) => {
  try {
    const { buildingName, buildingCode, floors } = req.body;

    // Input validation
    if (!buildingName || buildingName.trim() === "") {
      return res.status(400).json({ error: "Building name cannot be empty." });
    }
    const numFloorsInput = parseInt(floors);
    if (isNaN(numFloorsInput) || numFloorsInput < 1) {
      return res.status(400).json({ error: "Number of floors must be a positive number." });
    }

    // Check if building with the same name already exists
    const [existingBuildings] = await db.query("SELECT id FROM buildings WHERE name = ?", [buildingName]);
    if (existingBuildings.length > 0) {
      return res.status(409).json({ error: "Building with this name already exists." });
    }
    
    // Insert the building with custom name
    const [result] = await db.query(
      "INSERT INTO buildings (name, address, floors) VALUES (?, ?, ?)",
      [buildingName, buildingCode || null, floors || 1]
    );
    
    const buildingId = result.insertId;
    
    // Create floor entries for this building
    const numFloors = parseInt(floors) || 1;
    for (let i = 1; i <= numFloors; i++) {
      await db.query(
        "INSERT INTO floors (building_id, floor_number, name) VALUES (?, ?, ?)",
        [buildingId, i, `Floor ${i}`]
      );
    }
    
    res.json({ id: buildingId, buildingName, buildingCode, floors });
  } catch (err) {
    console.error("Error adding building:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete building
router.delete("/buildings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get all floors in this building
    const [floors] = await db.query("SELECT id FROM floors WHERE building_id = ?", [id]);
    
    // For each floor, get all rooms and delete their beds
    for (const floor of floors) {
      const [rooms] = await db.query("SELECT id FROM rooms WHERE floor_id = ?", [floor.id]);
      
      for (const room of rooms) {
        // Delete all beds in this room
        await db.query("DELETE FROM beds WHERE room_id = ?", [room.id]);
      }
      
      // Delete all rooms on this floor
      await db.query("DELETE FROM rooms WHERE floor_id = ?", [floor.id]);
    }
    
    // Delete all floors in this building
    await db.query("DELETE FROM floors WHERE building_id = ?", [id]);
    
    // Finally delete the building
    await db.query("DELETE FROM buildings WHERE id = ?", [id]);
    
    // Reset AUTO_INCREMENT for all tables to maintain sequential IDs
    const [maxBuilding] = await db.query("SELECT COALESCE(MAX(id), 0) as maxId FROM buildings");
    await db.query(`ALTER TABLE buildings AUTO_INCREMENT = ${maxBuilding[0].maxId + 1}`);
    
    const [maxFloor] = await db.query("SELECT COALESCE(MAX(id), 0) as maxId FROM floors");
    await db.query(`ALTER TABLE floors AUTO_INCREMENT = ${maxFloor[0].maxId + 1}`);
    
    const [maxRoom] = await db.query("SELECT COALESCE(MAX(id), 0) as maxId FROM rooms");
    await db.query(`ALTER TABLE rooms AUTO_INCREMENT = ${maxRoom[0].maxId + 1}`);
    
    const [maxBed] = await db.query("SELECT COALESCE(MAX(id), 0) as maxId FROM beds");
    await db.query(`ALTER TABLE beds AUTO_INCREMENT = ${maxBed[0].maxId + 1}`);
    
    res.json({ success: true, message: "Building deleted" });
  } catch (err) {
    console.error("Error deleting building:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all rooms
router.get("/rooms", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        r.id,
        r.room_number as roomNumber,
        b.name as building,
        f.floor_number as floor,
        f.id as floor_id,
        b.id as building_id
      FROM rooms r
      JOIN floors f ON r.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      ORDER BY b.name, f.floor_number, r.room_number
    `);
    res.json(results);
  } catch (err) {
    console.error("Rooms error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add room(s)
router.post("/rooms", async (req, res) => {
  try {
    const { roomNumber, building, floor } = req.body;
    const numRoomsToAdd = parseInt(roomNumber);
    
    if (!numRoomsToAdd || numRoomsToAdd < 1) {
      return res.status(400).json({ error: "Invalid number of rooms" });
    }
    
    // First get the floor_id for the given building and floor number
    const [floors] = await db.query(
      "SELECT f.id FROM floors f JOIN buildings b ON f.building_id = b.id WHERE b.name = ? AND f.floor_number = ?",
      [building, floor]
    );
    
    if (floors.length === 0) {
      return res.status(400).json({ error: "Floor not found for this building" });
    }
    
    // Get the highest existing room number for this floor
    const [maxRoom] = await db.query(
      "SELECT COALESCE(MAX(CAST(room_number AS UNSIGNED)), 0) as maxRoom FROM rooms WHERE floor_id = ?",
      [floors[0].id]
    );
    
    console.log(`📊 Max room for floor ${floor}: ${maxRoom[0].maxRoom}`);
    const startRoom = maxRoom[0].maxRoom + 1;
    console.log(`🏁 Starting room number: ${startRoom}`);
    const insertedIds = [];
    
    // Add multiple rooms (store as integers: 1, 2, 3, ..., 99)
    for (let i = 0; i < numRoomsToAdd; i++) {
      const roomNum = startRoom + i;
      
      // Validate room number range (1-99)
      if (roomNum > 99) {
        throw new Error(`Room number ${roomNum} exceeds maximum of 99`);
      }
      
      console.log(`➕ Creating room: ${roomNum}`);
      const [result] = await db.query(
        "INSERT INTO rooms (room_number, floor_id) VALUES (?, ?)",
        [roomNum, floors[0].id]
      );
      insertedIds.push(result.insertId);
    }
    
    res.json({ 
      success: true, 
      message: `Added ${numRoomsToAdd} room(s) - Room ${startRoom} to Room ${startRoom + numRoomsToAdd - 1}`,
      ids: insertedIds 
    });
  } catch (err) {
    console.error("Error adding room:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete room
router.delete("/rooms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete all beds in this room first
    await db.query("DELETE FROM beds WHERE room_id = ?", [id]);
    
    // Delete the room
    await db.query("DELETE FROM rooms WHERE id = ?", [id]);
    
    // Reset AUTO_INCREMENT for rooms and beds to maintain sequential IDs
    const [maxRoom] = await db.query("SELECT COALESCE(MAX(id), 0) as maxId FROM rooms");
    await db.query(`ALTER TABLE rooms AUTO_INCREMENT = ${maxRoom[0].maxId + 1}`);
    
    const [maxBed] = await db.query("SELECT COALESCE(MAX(id), 0) as maxId FROM beds");
    await db.query(`ALTER TABLE beds AUTO_INCREMENT = ${maxBed[0].maxId + 1}`);
    
    res.json({ success: true, message: "Room deleted" });
  } catch (err) {
    console.error("Error deleting room:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all beds
router.get("/beds", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        bed.id,
        bed.bed_number as bed_number,
        bed.bed_number as bedNumber,
        bed.status,
        r.room_number as room,
        b.name as building,
        f.floor_number as floor
      FROM beds bed
      JOIN rooms r ON bed.room_id = r.id
      JOIN floors f ON r.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      ORDER BY b.name, f.floor_number, r.room_number, bed.bed_number
    `);
    res.json(results);
  } catch (err) {
    console.error("Beds error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add bed(s)
router.post("/beds", async (req, res) => {
  try {
    const { bedNumber, room, building, floor } = req.body;
    const numBedsToAdd = parseInt(bedNumber);
    
    if (!numBedsToAdd || numBedsToAdd < 1) {
      return res.status(400).json({ error: "Number of beds must be at least 1" });
    }
    
    // Get room_id for the given building, floor, and room number
    const [rooms] = await db.query(`
      SELECT r.id 
      FROM rooms r
      JOIN floors f ON r.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE b.name = ? AND f.floor_number = ? AND r.room_number = ?
    `, [building, floor, room]);
    
    if (rooms.length === 0) {
      return res.status(400).json({ error: "Room not found" });
    }
    
    // Get the highest existing bed number for this room
    const [maxBed] = await db.query(
      "SELECT COALESCE(MAX(bed_number), 0) as maxBed FROM beds WHERE room_id = ?",
      [rooms[0].id]
    );
    
    const startBed = maxBed[0].maxBed + 1;
    const insertedIds = [];
    
    // Add multiple beds
    for (let i = 0; i < numBedsToAdd; i++) {
      const bedNum = startBed + i;
      const [result] = await db.query(
        "INSERT INTO beds (room_id, bed_number, status) VALUES (?, ?, 'AVAILABLE')",
        [rooms[0].id, bedNum]
      );
      insertedIds.push(result.insertId);
    }
    
    res.json({ 
      success: true, 
      message: `Added ${numBedsToAdd} bed(s) - Bed ${startBed} to Bed ${startBed + numBedsToAdd - 1}`,
      ids: insertedIds 
    });
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
    
    // Reset AUTO_INCREMENT for beds to maintain sequential IDs
    const [maxBed] = await db.query("SELECT COALESCE(MAX(id), 0) as maxId FROM beds");
    await db.query(`ALTER TABLE beds AUTO_INCREMENT = ${maxBed[0].maxId + 1}`);
    
    res.json({ success: true, message: "Bed deleted" });
  } catch (err) {
    console.error("Error deleting bed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all floors with building info
router.get("/floors", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        f.id,
        f.floor_number as floorNumber,
        f.name as floorName,
        b.name as building,
        b.id as building_id
      FROM floors f
      JOIN buildings b ON f.building_id = b.id
      ORDER BY b.name, f.id
    `);
    res.json(results);
  } catch (err) {
    console.error("Floors error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add floor(s)
router.post("/floors", async (req, res) => {
  try {
    const { building, floorNumber } = req.body;
    const numFloorsToAdd = parseInt(floorNumber);
    
    if (!numFloorsToAdd || numFloorsToAdd < 1) {
      return res.status(400).json({ error: "Invalid number of floors" });
    }
    
    // Get building_id for the given building name
    const [buildings] = await db.query(
      "SELECT id FROM buildings WHERE name = ?",
      [building]
    );
    
    if (buildings.length === 0) {
      return res.status(400).json({ error: "Building not found" });
    }
    
    // Get the highest existing floor number
    const [maxFloor] = await db.query(
      "SELECT COALESCE(MAX(floor_number), 0) as maxFloor FROM floors WHERE building_id = ?",
      [buildings[0].id]
    );
    
    const startFloor = maxFloor[0].maxFloor + 1;
    const insertedIds = [];
    
    // Add multiple floors
    for (let i = 0; i < numFloorsToAdd; i++) {
      const floorNum = startFloor + i;
      const [result] = await db.query(
        "INSERT INTO floors (building_id, floor_number, name) VALUES (?, ?, ?)",
        [buildings[0].id, floorNum, `Floor ${floorNum}`]
      );
      insertedIds.push(result.insertId);
    }
    
    res.json({ 
      success: true, 
      message: `Added ${numFloorsToAdd} floor(s) starting from Floor ${startFloor}`,
      ids: insertedIds 
    });
  } catch (err) {
    console.error("Error adding floor:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete floor
router.delete("/floors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get all rooms in this floor
    const [rooms] = await db.query("SELECT id FROM rooms WHERE floor_id = ?", [id]);
    
    // Delete all beds in these rooms
    for (const room of rooms) {
      await db.query("DELETE FROM beds WHERE room_id = ?", [room.id]);
    }
    
    // Delete all rooms in this floor
    await db.query("DELETE FROM rooms WHERE floor_id = ?", [id]);
    
    // Delete the floor
    await db.query("DELETE FROM floors WHERE id = ?", [id]);
    
    // Reset AUTO_INCREMENT for floors, rooms, and beds to maintain sequential IDs
    const [maxFloor] = await db.query("SELECT COALESCE(MAX(id), 0) as maxId FROM floors");
    await db.query(`ALTER TABLE floors AUTO_INCREMENT = ${maxFloor[0].maxId + 1}`);
    
    const [maxRoom] = await db.query("SELECT COALESCE(MAX(id), 0) as maxId FROM rooms");
    await db.query(`ALTER TABLE rooms AUTO_INCREMENT = ${maxRoom[0].maxId + 1}`);
    
    const [maxBed] = await db.query("SELECT COALESCE(MAX(id), 0) as maxId FROM beds");
    await db.query(`ALTER TABLE beds AUTO_INCREMENT = ${maxBed[0].maxId + 1}`);
    
    res.json({ success: true, message: "Floor deleted" });
  } catch (err) {
    console.error("Error deleting floor:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
