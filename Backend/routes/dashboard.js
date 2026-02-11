const express = require("express");
const db = require("../db");
const router = express.Router();

// Get bed vacancies by building
router.get("/vacancies", async (req, res) => {
  try {
    const [bookingTableRows] = await db.query(
      `SELECT 1
       FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name = 'bookings'
       LIMIT 1`
    );

    const hasBookingsTable = bookingTableRows.length > 0;

    const query = hasBookingsTable
      ? `
        SELECT
          b.name AS building_name,
          COUNT(DISTINCT bed.id) AS total_beds,
          COUNT(
            DISTINCT CASE
              WHEN bed.status = 'AVAILABLE'
                AND bed.id NOT IN (
                  SELECT DISTINCT bed_id
                  FROM bookings
                  WHERE status IN ('PENDING', 'ACTIVE')
                )
              THEN bed.id
            END
          ) AS vacant_beds
        FROM buildings b
        LEFT JOIN floors f ON b.id = f.building_id
        LEFT JOIN rooms r ON f.id = r.floor_id
        LEFT JOIN beds bed ON r.id = bed.room_id
        GROUP BY b.id, b.name
        ORDER BY b.name
      `
      : `
        SELECT
          b.name AS building_name,
          COUNT(DISTINCT bed.id) AS total_beds,
          COUNT(DISTINCT CASE WHEN bed.status = 'AVAILABLE' THEN bed.id END) AS vacant_beds
        FROM buildings b
        LEFT JOIN floors f ON b.id = f.building_id
        LEFT JOIN rooms r ON f.id = r.floor_id
        LEFT JOIN beds bed ON r.id = bed.room_id
        GROUP BY b.id, b.name
        ORDER BY b.name
      `;

    const [results] = await db.query(query);
    const vacancyData = results || [];
    res.json(vacancyData);
  } catch (error) {
    console.error("Error fetching vacancies:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/all-contractors", async (req, res) => {
  try {
    const query = `
      SELECT 
        contractor_name, 
        company, 
        COUNT(*) as employeeCount
      FROM allocations 
      WHERE contractor_name IS NOT NULL AND contractor_name != ''
      GROUP BY contractor_name, company
      ORDER BY contractor_name
    `;
    
    const [results] = await db.query(query);
    res.json(results || []);
  } catch (error) {
    console.error("Error fetching contractors:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get dashboard summary data by vendor/contractor
router.get("/summary", async (req, res) => {
  try {
    // Get first contractor with company and count of allocations
    const query = `
      SELECT 
        contractor_name, 
        company, 
        COUNT(*) as activeEmployees
      FROM allocations 
      WHERE contractor_name IS NOT NULL AND contractor_name != ''
      GROUP BY contractor_name, company
      LIMIT 1
    `;
    
    const [results] = await db.query(query);

    if (!results || results.length === 0) {
      return res.json({
        vendorName: "N/A",
        companyName: "N/A",
        activeEmployees: 0,
        inactiveEmployees: 0
      });
    }

    const data = results[0];
    
    res.json({
      vendorName: data.contractor_name || "N/A",
      companyName: data.company || "N/A",
      activeEmployees: data.activeEmployees || 0,
      inactiveEmployees: 0
    });
  } catch (error) {
    console.error("Error in dashboard summary:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;
