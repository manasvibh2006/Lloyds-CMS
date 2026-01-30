const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "cms_user",
  password: "cms_password123",
  database: "cms",
  port: 3306
});

// Test connection
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("DB connected successfully");
    connection.release();
  } catch (err) {
    console.error("DB connection failed:", err.message);
  }
})();

module.exports = db;
