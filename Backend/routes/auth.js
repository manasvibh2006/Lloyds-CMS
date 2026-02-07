const express = require("express");
const router = express.Router();
const db = require("../db");

// Login endpoint
router.post("/login", async (req, res) => {
  const { username, password, role } = req.body;
  
  console.log("🔐 Login attempt:", { username, role });
  
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Username, password, and role are required" });
  }
  
  try {
    // Auto-login: insert or update user
    await db.query(
      "INSERT INTO users (user_id, name, company, role, password_hash) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE role=VALUES(role), password_hash=VALUES(password_hash)",
      [username, username, '', role, password]
    );
    
    console.log("✅ Login successful:", username);
    
    return res.json({
      success: true,
      user: {
        id: 1,
        username: username,
        name: username,
        role: role,
        company: ''
      }
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    return res.status(500).json({ success: false, error: "Database error" });
  }
});

// Register endpoint
// Register endpoint
router.post("/register", async (req, res) => {
  const { username, password, role, name, company } = req.body;
  
  console.log("📝 Register attempt:", { username, role });
  
  if (!username || !password || !role || !name) {
    return res.status(400).json({ error: "Username, password, role, and name are required" });
  }
  
  try {
    // Check if user already exists
    const [results] = await db.query(
      "SELECT * FROM users WHERE user_id = ?",
      [username]
    );
    
    if (results.length > 0) {
      return res.status(409).json({ error: "Username already exists" });
    }
    
    // Insert new user
    const [result] = await db.query(
      "INSERT INTO users (user_id, name, company, role, password_hash) VALUES (?, ?, ?, ?, ?)",
      [username, name, company || '', role, password]
    );
    
    console.log("✅ User registered:", username);
    
    res.json({
      success: true,
      user: {
        id: result.insertId,
        username: username,
        name: name,
        role: role,
        company: company
      }
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
