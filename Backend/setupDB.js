const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const connection = mysql.createConnection({
  host: "localhost",
  user: "cms_user",
  password: "cms_password123",
  database: "cms"
});

connection.connect((err) => {
  if (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }
  console.log("Connected to database");

  // Read and execute the schema file
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  // Split by semicolon and execute each statement
  const statements = schema
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);

  let completed = 0;

  statements.forEach((statement) => {
    connection.query(statement, (err) => {
      if (err) {
        console.error("Error executing statement:", err.message);
      } else {
        console.log("✓ Executed:", statement.substring(0, 50) + "...");
      }

      completed++;
      if (completed === statements.length) {
        console.log("\n✓ Database setup completed!");
        connection.end();
        process.exit(0);
      }
    });
  });
});
