const express = require("express");
const db = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  const { userName, company, bedId } = req.body;

  if (!userName || !company || !bedId) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const sql = `
    INSERT INTO bookings (user_name, company, bed_id, status)
    VALUES (?, ?, ?, 'PENDING')
  `;

  try {
    const [result] = await db.query(sql, [userName, company, bedId]);
    res.json({
      message: "Booking stored",
      bookingId: result.insertId
    });
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
