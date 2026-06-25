const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Bookings Collection
const bookingsCollection = db.collection("bookings");
const classesCollection = db.collection("classes");

// Create a new booking
router.post("/", async (req, res) => {
  try {
    const booking = req.body;
    booking.createdAt = new Date();
    
    // Check user role
    const usersCollection = db.collection("user");
    if (!booking.userEmail) {
      return res.status(400).json({ error: "User email is required" });
    }
    const user = await usersCollection.findOne({ email: booking.userEmail });
    if (!user || user.role !== "user") {
      return res.status(403).json({ error: "Only regular users can book classes" });
    }
    
    // Check if already booked
    const existingBooking = await bookingsCollection.findOne({
      userEmail: booking.userEmail,
      classId: booking.classId
    });

    if (existingBooking) {
      return res.status(400).json({ error: "You have already booked this class." });
    }

    const result = await bookingsCollection.insertOne(booking);

    // Increment bookingCount in the classes collection
    if (booking.classId) {
      await classesCollection.updateOne(
        { _id: new ObjectId(booking.classId) },
        { $inc: { bookingCount: 1 } }
      );
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// Check if a user has booked a specific class
router.get("/check/:email/:classId", async (req, res) => {
  try {
    const { email, classId } = req.params;
    
    const booking = await bookingsCollection.findOne({
      userEmail: email,
      classId: classId
    });

    res.json({ isBooked: !!booking });
  } catch (error) {
    console.error("Error checking booking:", error);
    res.status(500).json({ error: "Failed to check booking" });
  }
});

// Get all bookings (Transactions)
router.get("/", async (req, res) => {
  try {
    const bookings = await bookingsCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ error: "Failed to fetch all bookings" });
  }
});

// Get all bookings for a user by email
router.get("/my-bookings/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const query = { userEmail: email };
    
    // Sort by createdAt descending
    const bookings = await bookingsCollection.find(query).sort({ createdAt: -1 }).toArray();
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

module.exports = router;
