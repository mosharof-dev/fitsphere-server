const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");

// Get user collection
const usersCollection = db.collection("user");

// Get All Users
router.get("/", async (req, res) => {
  const query = {};
  const cursor = usersCollection.find(query);
  const result = await cursor.toArray();
  res.send(result);
});

module.exports = router;
