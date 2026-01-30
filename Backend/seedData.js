const db = require("./db");

async function seedData() {
  try {
    // Get building-1 ID
    const [buildings] = await db.query("SELECT id FROM buildings WHERE name = 'building-1'");
    const buildingId = buildings[0].id;
    console.log("Building ID:", buildingId);

    // Insert floors (Ground, First, Second)
    const floorNames = ['Ground', 'First', 'Second'];
    
    for (const floorName of floorNames) {
      const [floorResult] = await db.query(
        "INSERT INTO floors (building_id, name) VALUES (?, ?)",
        [buildingId, floorName]
      );
      const floorId = floorResult.insertId;
      console.log(`Created floor ${floorName}, ID: ${floorId}`);

      // Insert rooms (1-18 per floor)
      for (let roomNum = 1; roomNum <= 18; roomNum++) {
        const [roomResult] = await db.query(
          "INSERT INTO rooms (floor_id, room_number) VALUES (?, ?)",
          [floorId, String(roomNum).padStart(2, '0')]
        );
        const roomId = roomResult.insertId;
        console.log(`  Created room ${roomNum}, ID: ${roomId}`);

        // Insert beds (10 bunks, 2 positions each = 20 beds per room)
        for (let bunkNum = 1; bunkNum <= 10; bunkNum++) {
          await db.query(
            "INSERT INTO beds (room_id, bunk_number, position, status) VALUES (?, ?, 'L', 'AVAILABLE'), (?, ?, 'U', 'AVAILABLE')",
            [roomId, bunkNum, roomId, bunkNum]
          );
        }
        console.log(`    Created 20 beds (10 bunks) for room ${roomNum}`);
      }
    }

    console.log("\n✅ Data seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seedData();
