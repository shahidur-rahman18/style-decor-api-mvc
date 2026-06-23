const User = require("../models/User.model");

const verifyAdmin = async (req, res, next) => {
  const user = await User.findOne({ email: req.tokenEmail }).lean();
  if (user?.role !== "admin") {
    return res
      .status(403)
      .send({ message: "Admin only Actions!", role: user?.role });
  }
  next();
};

const verifySeller = async (req, res, next) => {
  const user = await User.findOne({ email: req.tokenEmail }).lean();
  if (user?.role !== "seller") {
    return res
      .status(403)
      .send({ message: "Seller only Actions!", role: user?.role });
  }
  next();
};

module.exports = { verifyAdmin, verifySeller };
