const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");
const { ObjectId } = require("mongodb");
const verifyToken = require("../../middlewares/verifyToken");
const verifyTrainer = require("../../middlewares/verifyTrainer");
const verifyAdmin = require("../../middlewares/verifyAdmin");
const verifyBlockedUser = require("../../middlewares/verifyBlockedUser");

// Classes Collection
const classesCollection = db.collection("classes");
const usersCollection = db.collection("user");

// Post Classes Api
router.post("/", verifyToken, verifyTrainer, verifyBlockedUser, async (req, res) => {
  const classInfo = req.body;

  const trainer = await usersCollection.findOne({
    email: classInfo.trainerEmail,
  });

  if (!trainer) {
    return res
      .status(404)
      .json({ success: false, message: "Trainer not found" });
  }

  if (trainer.status === "blocked") {
    return res.status(403).json({ success: false, message: "Action restricted by Admin. You are blocked." });
  }

  const newClass = {
    ...classInfo,
    trainerId: trainer._id,
    trainerName: trainer.name,
    trainerEmail: trainer.email,
    trainerImage: trainer.image,
    status: "pending",
    bookingCount: 0,
    createdAt: new Date(),
  };

  const result = await classesCollection.insertOne(newClass);

  res.send(result);
});

// Get All Approved Classes Api
router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;

    const search = req.query.search || "";
    const category = req.query.category || "";

    const query = {
      status: "approved",
    };

    // Search by class name
    if (search) {
      query.class_name = {
        $regex: search,
        $options: "i",
      };
    }

    // Filter by category
    if (category) {
      const categoriesArray = category.split(",").map((c) => c.trim());

      query.category = {
        $in: categoriesArray,
      };
    }

    const skip = (page - 1) * limit;

    const data = await classesCollection
      .find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await classesCollection.countDocuments(query);

    res.status(200).send({
      data,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get classes error:", error);

    res.status(500).send({
      success: false,
      message: "Failed to fetch classes",
    });
  }
});

// Get All Classes for Admin Api (Includes pending, approved, rejected)
router.get("/all-classes", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const query = {};

    const data = await classesCollection
      .find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await classesCollection.countDocuments(query);

    res.status(200).send({
      data,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get all admin classes error:", error);

    res.status(500).send({
      success: false,
      message: "Failed to fetch classes for admin",
    });
  }
});

// Get Featured Classes Api (Top Booked)
router.get("/featured", async (req, res) => {
  try {
    const data = await classesCollection
      .find({ status: "approved" })
      .sort({ bookingCount: -1 })
      .limit(8)
      .toArray();

    res.status(200).send(data);
  } catch (error) {
    console.error("Get featured classes error:", error);
    res.status(500).send({
      success: false,
      message: "Failed to fetch featured classes",
    });
  }
});

// Get Single Class Api
router.get("/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await classesCollection.findOne(query);
  res.send(result);
});

// Get trainer my classes api
router.get("/my-classes/:id", verifyToken, verifyTrainer, async (req, res) => {
  try {
    const id = req.params.id;
    const query = { trainerId: new ObjectId(id) };
    const result = await classesCollection
      .find(query)
      .sort({ _id: -1 })
      .toArray();
    res.send(result);
  } catch (error) {
    console.error("Get trainer my classes error:", error);
    res.status(500).send({
      success: false,
      message: "Failed to fetch trainer's classes",
    });
  }
});

// Update Class Api
router.patch("/:id", verifyToken, verifyTrainer, verifyBlockedUser, async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const updatedClass = req.body;
    const result = await classesCollection.updateOne(query, {
      $set: updatedClass,
    });
    res.send(result);
  } catch (error) {
    console.error("Update class error:", error);
    res.status(500).send({
      success: false,
      message: "Failed to update class",
    });
  }
});
// Delete Class Api
router.delete("/:id", verifyToken, verifyTrainer, verifyBlockedUser, async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await classesCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.error("Delete class error:", error);
    res.status(500).send({
      success: false,
      message: "Failed to delete class",
    });
  }
});

// Update Class Status Api
router.patch("/status/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const { status } = req.body;

    // Status should be either "approved", "rejected", or "pending"
    const result = await classesCollection.updateOne(query, {
      $set: { status: status },
    });

    res.send(result);
  } catch (error) {
    console.error("Update class status error:", error);
    res.status(500).send({
      success: false,
      message: "Failed to update class status",
    });
  }
});

module.exports = router;
