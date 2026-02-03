const express = require("express");
const router = express.Router();
const db = require("../db");

// Login endpoint
router.post("/login", (req, res) => {
  const { username, password, role } = req.body;
  
  console.log("🔐 Login attempt:", { username, role });
  
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Username, password, and role are required" });
  }
  
  // Auto-login: insert or update user
  db.query(
    "INSERT INTO users (user_id, name, company, role, password_hash) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE role=VALUES(role), password_hash=VALUES(password_hash)",
    [username, username, '', role, password],
    (err, result) => {
      if (err) {
        console.error("❌ Login Error:", err);
        return res.status(500).json({ success: false, error: "Database error" });
      }
      
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
    }
  );
});

// Register endpoint
router.post("/register", (req, res) => {
  const { username, password, role, name, company } = req.body;
  
  console.log("📝 Register attempt:", { username, role });
  
  if (!username || !password || !role || !name) {
    return res.status(400).json({ error: "Username, password, role, and name are required" });
  }
  
  // Check if user already exists
  db.query(
    "SELECT * FROM users WHERE user_id = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("❌ Register check error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (results.length > 0) {
        return res.status(409).json({ error: "Username already exists" });
      }
      
      // Insert new user
      db.query(
        "INSERT INTO users (user_id, name, company, role, password_hash) VALUES (?, ?, ?, ?, ?)",
        [username, name, company || '', role, password],
        (err, result) => {
          if (err) {
            console.error("❌ Register insert error:", err);
            return res.status(500).json({ error: "Failed to create user" });
          }
          
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
        }
      );
    }
  );
});

module.exports = router;
