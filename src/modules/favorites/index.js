const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");

// Favorites Collection
const favoritesCollection = db.collection("favorites");

module.exports = router;
