const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "cms_user",
  password: "cms_password123",
  database: "cms",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
(async () => {
  try {
    await db.query("SELECT 1");
    console.log("✅ DB connected successfully");
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
  }
})();

module.exports = db;
