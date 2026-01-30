const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", async (req, res) => {
  const { userId, userName, company, bedId } = req.body;

  if (!userId || !userName || !company || !bedId) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO bookings (user_id, bed_id, status)
       VALUES (?, ?, 'PENDING')`,
      [userId, bedId]
    );

    res.json({ bookingId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});

module.exports = router;
