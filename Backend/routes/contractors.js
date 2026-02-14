const express = require("express");
const router = express.Router();
const db = require("../db");

// Ensure contractors table exists.
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS contractors (
        id INT NOT NULL AUTO_INCREMENT,
        contractor_code VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_contractors_contractor_code (contractor_code),
        UNIQUE KEY uq_contractors_email (email),
        UNIQUE KEY uq_contractors_phone_number (phone_number)
      )
    `);
  } catch (err) {
    console.error("Failed to ensure contractors table:", err.message);
  }
})();

router.get("/", async (_req, res) => {
  try {
    const [masterRows] = await db.query(
      `SELECT
         c.id,
         c.contractor_code,
         c.name,
         c.company,
         c.phone_number,
         c.email,
         c.created_at,
         c.updated_at,
         COUNT(DISTINCT CASE WHEN a.status = 'BOOKED' THEN a.user_id END) AS worker_count
       FROM contractors c
       LEFT JOIN allocations a
         ON LOWER(TRIM(a.contractor_name)) = LOWER(TRIM(c.name))
       GROUP BY c.id, c.contractor_code, c.name, c.company, c.phone_number, c.email, c.created_at, c.updated_at
       ORDER BY id DESC`
    );

    // Include legacy contractor names that exist only in allocations.
    const [legacyRows] = await db.query(
      `SELECT
         NULL AS id,
         NULL AS contractor_code,
         TRIM(a.contractor_name) AS name,
         COALESCE(NULLIF(TRIM(u.company), ''), 'N/A') AS company,
         '' AS phone_number,
         '' AS email,
         NULL AS created_at,
         NULL AS updated_at,
         COUNT(DISTINCT CASE WHEN a.status = 'BOOKED' THEN a.user_id END) AS worker_count
       FROM allocations a
       LEFT JOIN users u ON u.user_id = a.user_id
       WHERE a.contractor_name IS NOT NULL
         AND TRIM(a.contractor_name) <> ''
         AND UPPER(TRIM(a.contractor_name)) <> 'N/A'
         AND NOT EXISTS (
           SELECT 1
           FROM contractors c
           WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(a.contractor_name))
         )
       GROUP BY TRIM(a.contractor_name), COALESCE(NULLIF(TRIM(u.company), ''), 'N/A')`
    );

    res.json([...(masterRows || []), ...(legacyRows || [])]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { contractorCode, name, company, phoneNumber, email } = req.body;

  if (!contractorCode || !name || !company || !phoneNumber || !email) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO contractors (contractor_code, name, company, phone_number, email)
       VALUES (?, ?, ?, ?, ?)`,
      [
        contractorCode.trim(),
        name.trim(),
        company.trim(),
        phoneNumber.trim(),
        email.trim().toLowerCase()
      ]
    );

    return res.status(201).json({
      id: result.insertId,
      message: "Contractor created successfully"
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Contractor code, email, or phone number already exists"
      });
    }
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
