const express = require("express");
const router = express.Router();
const { db } = require("../../config/db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const verifyToken = require("../../middlewares/verifyToken");

// Payments Collection
const paymentsCollection = db.collection("payments");

router.post("/create-checkout-session", verifyToken, async (req, res) => {
  try {
    const { price, className, classId, trainerName, customerEmail, classImage } = req.body;
    
    const usersCollection = db.collection("user");
    
    if (!customerEmail) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    const user = await usersCollection.findOne({ email: customerEmail });
    if (!user || user.role !== "user") {
      return res.status(403).json({ error: "Only regular users can book classes" });
    }

    // Stripe expects the amount in cents
    const amount = parseInt(price * 100);

    if (!amount || amount < 1) {
      return res.status(400).json({ error: "Invalid price amount" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: className,
              description: `Trainer: ${trainerName}`,
              images: classImage ? [classImage] : [],
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      // Adding a query param to success URL so we can finalize the booking
      success_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/payment-success?session_id={CHECKOUT_SESSION_ID}&classId=${classId}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/classes/${classId}`,
    });

    res.send({
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

module.exports = router;
