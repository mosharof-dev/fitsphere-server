const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");

// Bookings Collection
const bookingsCollection = db.collection("bookings");

module.exports = router;
