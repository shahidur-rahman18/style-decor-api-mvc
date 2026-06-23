const createVerifyAdmin = (usersCollection) => async (req, res, next) => {
  const user = await usersCollection.findOne({ email: req.tokenEmail });
  if (user?.role !== "admin") {
    return res
      .status(403)
      .send({ message: "Admin only Actions!", role: user?.role });
  }
  next();
};

const createVerifySeller = (usersCollection) => async (req, res, next) => {
  const user = await usersCollection.findOne({ email: req.tokenEmail });
  if (user?.role !== "seller") {
    return res
      .status(403)
      .send({ message: "Seller only Actions!", role: user?.role });
  }
  next();
};

module.exports = { createVerifyAdmin, createVerifySeller };
