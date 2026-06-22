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
  const cursor = classesCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});

module.exports = router;
