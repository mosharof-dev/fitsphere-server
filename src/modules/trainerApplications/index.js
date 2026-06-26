const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");
const { ObjectId } = require("mongodb");
const verifyToken = require("../../middlewares/verifyToken");
const verifyAdmin = require("../../middlewares/verifyAdmin");
const verifyBlockedUser = require("../../middlewares/verifyBlockedUser");

// Trainer Applications Collection
const applicationsCollection = db.collection("trainerApplications");
const usersCollection = db.collection("user");

// Create a new trainer application
router.post("/", verifyToken, verifyBlockedUser, async (req, res) => {
  try {
    const application = req.body;
    // Basic validation
    if (!application.email || !application.userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user is blocked
    const user = await usersCollection.findOne({ email: application.email });
    if (user && user.status === "blocked") {
      return res.status(403).json({ error: "Action restricted by Admin. You are blocked." });
    }

    // Check if user already has a pending application
    const existing = await applicationsCollection.findOne({
      email: application.email,
      status: "pending",
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "You already have a pending application" });
    }

    // Set default fields
    application.status = "pending";
    application.feedback = "";
    application.createdAt = new Date();

    const result = await applicationsCollection.insertOne(application);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating trainer application:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all applications (optionally filter by status)
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }
    const result = await applicationsCollection.find(query).toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching trainer applications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a single application by userId
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await applicationsCollection.findOne({ userId });
    if (!result) {
      return res.status(404).json({ error: "Application not found" });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching trainer application:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update application status (Approve/Reject)
router.patch("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const application = await applicationsCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const updateDoc = {
      $set: {
        status,
        ...(feedback && { feedback }),
        updatedAt: new Date(),
      },
    };

    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(id) },
      updateDoc,
    );

    // If approved, update user role to 'Trainer'
    if (status === "approved") {
      await usersCollection.updateOne(
        { email: application.email },
        { $set: { role: "trainer" } },
      );
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating trainer application:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
