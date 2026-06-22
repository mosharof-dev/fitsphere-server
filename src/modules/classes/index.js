const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");

// Classes Collection
const classesCollection = db.collection("classes");
const usersCollection = db.collection("user");

// router.post("/", async (req, res) => {
//   const trainer = await usersCollection.findOne({
//     email: req.body.trainerEmail,
//   });

//   const classInfo = req.body;
//   console.log(classInfo);

//   const newClass = {
//     ...classInfo,
//     trainerId: trainer._id,
//     trainerName: trainer.name,
//     trainerEmail: trainer.email,
//     status: "pending",
//     bookingCount: 0,
//     createdAt: new Date(),
//   };

//   const result = await classesCollection.insertOne(newClass);

//   res.send(result);
// });

router.post("/", async (req, res) => {
  const classInfo = req.body;

  const trainer = await usersCollection.findOne({
    email: classInfo.trainerEmail,
  });

  const newClass = {
    ...classInfo,
    trainerId: trainer._id,
    trainerName: trainer.name,
    trainerEmail: trainer.email,
    status: "pending",
    bookingCount: 0,
    createdAt: new Date(),
  };

  const result = await classesCollection.insertOne(newClass);

  res.send(result);
});
module.exports = router;
