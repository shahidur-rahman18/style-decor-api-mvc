const admin = require("../config/firebase");
const { verifyAccessToken } = require("../auth/token.service");
const { authLimiter } = require("./rateLimit.middleware");

const verifyJWTHandler = async (req, res, next) => {
  const token = req?.headers?.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access!" });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      provider: decoded.provider,
    };
    req.tokenEmail = decoded.email;
    return next();
  } catch {
    // fall through to Firebase (migration fallback)
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      email: decoded.email,
      provider: "firebase",
    };
    req.tokenEmail = decoded.email;
    return next();
  } catch {
    return res.status(401).send({ message: "Unauthorized Access!" });
  }
};

const verifyJWT = [authLimiter, verifyJWTHandler];

module.exports = { verifyJWT };
