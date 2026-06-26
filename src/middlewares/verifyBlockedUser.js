const { db } = require("../config/db");

module.exports = async (req, res, next) => {
  try {
    const email = req.decoded.email;
    const query = { email: email };
    const user = await db.collection("user").findOne(query);

    // Check if user is blocked
    if (user && user.status === "blocked") {
      return res
        .status(403)
        .json({ success: false, message: "Action restricted by Admin" });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};
