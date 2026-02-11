const express = require("express");
const router = express.Router();
const db = require("../db");

// CHECK if user is blacklisted
router.get("/check/:userId", async (req, res) => {
  const { userId } = req.params;
  
  try {
    const [result] = await db.query(
      "SELECT * FROM blacklist WHERE user_id = ? AND is_active = TRUE",
      [userId]
    );
    
    if (result.length > 0) {
      return res.json({ 
        isBlacklisted: true, 
        reason: result[0].reason,
        blacklistedAt: result[0].blacklisted_at,
        blacklistedBy: result[0].blacklisted_by
      });
    }
    
    res.json({ isBlacklisted: false });
  } catch (err) {
    console.error("Blacklist check error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET all blacklisted users
router.get("/all", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM blacklist WHERE is_active = TRUE ORDER BY blacklisted_at DESC"
    );
    
    res.json(results);
  } catch (err) {
    console.error("Blacklist fetch error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ADD user to blacklist
router.post("/add", async (req, res) => {
  const { userId, userName, company, reason, blacklistedBy } = req.body;
  
  if (!userId || !userName || !reason) {
    return res.status(400).json({ error: "Missing required fields: userId, userName, reason" });
  }
  
  try {
    // Check if user is already blacklisted
    const [existing] = await db.query(
      "SELECT * FROM blacklist WHERE user_id = ? AND is_active = TRUE",
      [userId]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ error: "User is already blacklisted" });
    }
    
    // Add to blacklist
    const [result] = await db.query(
      `INSERT INTO blacklist (user_id, user_name, company, reason, blacklisted_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, userName, company, reason, blacklistedBy || 'admin']
    );
    
    res.json({ 
      message: "User blacklisted successfully",
      blacklistId: result.insertId
    });
  } catch (err) {
    console.error("Blacklist add error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// REMOVE user from blacklist
router.delete("/remove/:userId", async (req, res) => {
  const { userId } = req.params;
  
  try {
    const [result] = await db.query(
      "UPDATE blacklist SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE",
      [userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found in blacklist" });
    }
    
    res.json({ message: "User removed from blacklist successfully" });
  } catch (err) {
    console.error("Blacklist remove error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
