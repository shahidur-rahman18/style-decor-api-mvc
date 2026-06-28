const express = require("express");
const {
  authLimiter,
  authStrictLimiter,
} = require("../middleware/rateLimit.middleware");
const { verifyJWT } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { registerBody, loginBody } = require("./auth.validation");
const authController = require("./auth.controller");

const router = express.Router();

router.post(
  "/auth/register",
  authStrictLimiter,
  validate(registerBody),
  authController.register
);
router.post(
  "/auth/login",
  authStrictLimiter,
  validate(loginBody),
  authController.login
);
router.post("/auth/refresh", authLimiter, authController.refresh);
router.post("/auth/logout", authLimiter, authController.logout);
router.post("/auth/logout-all", verifyJWT, authController.logoutAll);
router.get("/auth/me", verifyJWT, authController.getMe);
router.post(
  "/auth/firebase-sync",
  authStrictLimiter,
  authController.firebaseSync
);

module.exports = router;
