const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");

// Payments Collection
const paymentsCollection = db.collection("payments");

module.exports = router;
