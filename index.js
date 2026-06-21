const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connectDB } = require("./src/config/db");
const routes = require("./src/routes");

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

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
