const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");

// Comments Collection
const commentsCollection = db.collection("comments");

module.exports = router;
