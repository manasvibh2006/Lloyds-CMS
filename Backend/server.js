console.log("🔥 SERVER.JS LOADED 🔥");

const express = require("express");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/buildings", require("./routes/buildings"));
app.use("/api/floors", require("./routes/floors"));
app.use("/api/rooms", require("./routes/rooms"));
app.use("/api/beds", require("./routes/beds"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/allocations", require("./routes/allocations"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/camps", require("./routes/camps"));
app.use("/api/blacklist", require("./routes/blacklist"));
app.use("/api/contractors", require("./routes/contractors"));

// root test
app.get("/", (req, res) => {
  res.send("Welcome to Camp Management System");
});

const server = app.listen(5000, () => {
  console.log("✅ Server running on port 5000");
});

// Keep process alive
setInterval(() => {
  console.log("Server heartbeat");
}, 30000);
