const express = require("express");
const router = express.Router();
const db = require("../db"); 

// GET all allocations
router.get("/", (req, res) => {
  console.log("📡 Fetching allocations...");
  
  // First check if allocations table exists and has data
  db.query("SELECT COUNT(*) as count FROM allocations", (err, countResult) => {
    if (err) {
      console.error("❌ Error checking allocations table:", err.message);
      // Table might not exist, return empty array
      return res.json([]);
    }
    
    const count = countResult[0].count;
    console.log(`📊 Total allocations in DB: ${count}`);
    
    if (count === 0) {
      console.log("⚠️ No allocations found, returning empty array");
      return res.json([]);
    }
    
    // Fetch with joins - simplified query
    db.query(`
      SELECT 
        a.id,
        a.user_id as userId,
        a.user_name as userName,
        a.company,
        a.contractor_name as contractorName,
        a.remarks,
        a.status,
        a.allocated_at as created_at,
        a.start_date,
        a.end_date,
        b.bunk_number,
        b.position,
        r.room_number,
        f.id as floorId,
        bld.name as buildingName
      FROM allocations a
      JOIN beds b ON a.bed_id = b.id
      JOIN rooms r ON b.room_id = r.id
      JOIN floors f ON r.floor_id = f.id
      JOIN buildings bld ON f.building_id = bld.id
      ORDER BY a.allocated_at DESC
    `, (err, results) => {
      if (err) {
        console.error("❌ Allocations fetch error:", err.message);
        console.error("Full error:", err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`✅ Found ${results.length} allocations`);
      res.json(results);
    });
  });
});

// CREATE ALLOCATION
router.post("/", (req, res) => {
  console.log("🔥 ALLOCATION API HIT 🔥");
  console.log("REQ BODY:", req.body);

  const {
    userId,
    userName,
    company,
    contractorName,
    bedId,
    startDate,
    endDate,
    remarks
  } = req.body;

  if (!userId || !userName || !company || !bedId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Check bed availability and insert in one go
  db.query(
    `INSERT INTO allocations
     (user_id, user_name, company, bed_id, contractor_name, remarks, start_date, end_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'BOOKED')`,
    [userId, userName, company, bedId, contractorName || 'N/A', remarks || null, startDate || null, endDate || null],
    (err, result) => {
      if (err) {
        console.error("❌ Allocation error:", err);
        return res.status(500).json({ error: err.message });
      }

      // Update bed status
      db.query(
        "UPDATE beds SET status = 'BOOKED' WHERE id = ?",
        [bedId],
        (updateErr) => {
          if (updateErr) {
            console.error("Error updating bed:", updateErr);
            return res.status(500).json({ error: updateErr.message });
          }
          res.json({ message: "Allocation successful" });
        }
      );
    }
  );
});

// DELETE - Unbook allocation and release bed
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const { bedId } = req.query;

  // Update bed status to AVAILABLE
  db.query("UPDATE beds SET status = 'AVAILABLE' WHERE id = ?", [bedId], (err) => {
    if (err) {
      console.error("Error updating bed:", err);
      return res.status(500).json({ error: err.message });
    }

    // Delete or mark allocation as released
    db.query(
      "UPDATE allocations SET status = 'RELEASED', released_at = NOW() WHERE id = ?",
      [id],
      (updateErr) => {
        if (updateErr) {
          console.error("Error unbooking allocation:", updateErr);
          return res.status(500).json({ error: updateErr.message });
        }
        res.json({ success: true, message: "Bed unbooked successfully" });
      }
    );
  });
});

module.exports = router;