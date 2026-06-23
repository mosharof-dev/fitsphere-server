const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Classes Collection
const classesCollection = db.collection("classes");
const usersCollection = db.collection("user");

// Post Classes Api
router.post("/", async (req, res) => {
  const classInfo = req.body;

  const trainer = await usersCollection.findOne({
    email: classInfo.trainerEmail,
  });

  if (!trainer) {
    return res
      .status(404)
      .json({ success: false, message: "Trainer not found" });
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

// Get Single Class Api
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await classesCollection.findOne(query);
  res.send(result);
});

module.exports = router;
