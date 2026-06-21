const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");

// Classes Collection
const classesCollection = db.collection("classes");

module.exports = router;
