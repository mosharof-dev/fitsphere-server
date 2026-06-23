const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");

// Classes Collection
const classesCollection = db.collection("classes");
const usersCollection = db.collection("user");

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

router.get("/", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;

  const search = req.query.search || "";
  const category = req.query.category || "";

  const query = {};

  // Search
  if (search) {
    query.class_name = {
      $regex: search,
      $options: "i",
    };
  }

  // Filter
  if (category) {
    const categoriesArray = category.split(',').map(c => c.trim());
    query.category = {
      $in: categoriesArray,
    };
  }

  const skip = (page - 1) * limit;

  const result = await classesCollection
    .find(query)
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await classesCollection.countDocuments(
    query
  );

  res.send({
    data: result,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  });
});
module.exports = router;
