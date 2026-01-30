const express = require("express");
const db = require("../db");

const router = express.Router();

router.post("/", (req, res) => {
  const { userName, company, bedId } = req.body;

  if (!userName || !company || !bedId) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const sql = `
    INSERT INTO bookings (user_name, company, bed_id, status)
    VALUES (?, ?, ?, 'PENDING')
  `;

  db.query(sql, [userName, company, bedId], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Booking stored",
      bookingId: result.insertId
    });
  });
});

module.exports = router;
