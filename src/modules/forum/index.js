const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");

// Forum Collection
const forumCollection = db.collection("forum");

module.exports = router;
