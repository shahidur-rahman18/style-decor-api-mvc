const express = require("express");
const { verifyJWT } = require("../middleware/auth.middleware");
const dashboardController = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/dashboard/stats", verifyJWT, dashboardController.getStats);
router.get("/dashboard/analytics", verifyJWT, dashboardController.getAnalytics);

module.exports = router;
