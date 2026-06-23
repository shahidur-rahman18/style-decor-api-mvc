const admin = require("../config/firebase");
const { authLimiter } = require("./rateLimit.middleware");

const verifyJWTHandler = async (req, res, next) => {
  const token = req?.headers?.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access!" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.tokenEmail = decoded.email;
    next();
  } catch {
    return res.status(401).send({ message: "Unauthorized Access!" });
  }
};

const verifyJWT = [authLimiter, verifyJWTHandler];

module.exports = { verifyJWT };
