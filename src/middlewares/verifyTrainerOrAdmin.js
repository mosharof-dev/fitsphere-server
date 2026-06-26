const { db } = require("../config/db");

module.exports = async (req, res, next) => {
  try {
    const email = req.decoded.email;
    const query = { email: email };
    const user = await db.collection("user").findOne(query);

    if (!user || (user.role !== "trainer" && user.role !== "admin")) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden access" });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};
