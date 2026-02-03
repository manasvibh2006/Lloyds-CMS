const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "cms_user",
  password: "cms_password123",
  database: "cms",
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB connection failed:", err.message);
    return;
  }
  console.log("✅ DB connected successfully");
});

module.exports = db;
