const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");
const verifyToken = require("../../middlewares/verifyToken");
const verifyBlockedUser = require("../../middlewares/verifyBlockedUser");

// Favorites Collection
const favoritesCollection = db.collection("favorites");
// Users Collection for role validation
const usersCollection = db.collection("user");

// POST: Add a favorite for a user
router.post("/", verifyToken, verifyBlockedUser, async (req, res) => {
  try {
    const favoriteData = req.body;
    
    // Check user role from database
    const user = await usersCollection.findOne({ email: favoriteData.userEmail });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (user.role === "admin" || user.role === "trainer") {
      return res.status(403).send({ message: "Admins and Trainers cannot favorite classes" });
    }

    if (user.status === "blocked") {
      return res.status(403).send({ message: "Action restricted by Admin. You are blocked." });
    }

    // Check if it already exists
    const existing = await favoritesCollection.findOne({
      userEmail: favoriteData.userEmail,
      classId: favoriteData.classId,
    });

    if (existing) {
      return res.status(400).send({ message: "Class is already in favorites" });
    }

    // Add timestamp
    favoriteData.createdAt = new Date();

    const result = await favoritesCollection.insertOne(favoriteData);
    res.send(result);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Failed to add to favorites", error: error.message });
  }
});

// GET: Check if a specific class is favorited by a user
router.get("/check/:classId", verifyToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).send({ message: "userEmail is required" });
    }

    const favorite = await favoritesCollection.findOne({ classId, userEmail });

    res.send({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).send({
      message: "Failed to check favorite status",
      error: error.message,
    });
  }
});

// GET: Get all favorites for a user
router.get("/:userEmail", verifyToken, async (req, res) => {
  try {
    const { userEmail } = req.params;
    const favorites = await favoritesCollection.find({ userEmail }).toArray();
    res.send(favorites);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Failed to fetch favorites", error: error.message });
  }
});

// DELETE: Remove a favorite
router.delete("/:classId", verifyToken, verifyBlockedUser, async (req, res) => {
  try {
    const { classId } = req.params;
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).send({ message: "userEmail is required" });
    }

    const result = await favoritesCollection.deleteOne({ classId, userEmail });

    if (result.deletedCount === 1) {
      res.send({ message: "Removed from favorites successfully", result });
    } else {
      res.status(404).send({ message: "Favorite not found" });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "Failed to remove favorite", error: error.message });
  }
});

module.exports = router;
