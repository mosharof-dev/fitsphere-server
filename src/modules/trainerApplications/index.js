const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");

// Trainer Applications Collection
const applicationsCollection = db.collection("trainerApplications");

module.exports = router;
