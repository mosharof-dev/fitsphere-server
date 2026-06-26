const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { connectDB } = require("./src/config/db");
const routes = require("./src/routes");

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: [process.env.CLIENT_URL || "http://localhost:3000", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Connect Database
connectDB();

// Central Routes setup
app.use("/api", routes);

// Root end-point
app.get("/", (req, res) => {
  res.send("FitSphere Server is running");
});

// Global Error Handler & 404 Route
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "API Not Found" });
});

app.listen(port, () => {
  console.log(`FitSphere Server is running on port ${port}`);
});
