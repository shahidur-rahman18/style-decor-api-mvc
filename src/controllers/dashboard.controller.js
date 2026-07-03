const catchAsync = require("../utils/catchAsync");
const User = require("../models/User.model");
const dashboardService = require("../services/dashboard.service");

const getStats = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.tokenEmail }).lean();
  if (!user) {
    return res.status(404).send({ message: "User not found" });
  }

  let stats;
  switch (user.role) {
    case "admin":
      stats = await dashboardService.getAdminStats();
      break;
    case "seller":
      stats = await dashboardService.getSellerStats(req.tokenEmail);
      break;
    default:
      stats = await dashboardService.getCustomerStats(req.tokenEmail);
  }

  res.send({ success: true, role: user.role, data: stats });
});

const getAnalytics = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.tokenEmail }).lean();
  if (!user) {
    return res.status(404).send({ message: "User not found" });
  }

  const period = req.query.period || "30d";
  const analytics = await dashboardService.getAnalytics(
    req.tokenEmail,
    user.role,
    period
  );

  res.send({ success: true, role: user.role, data: analytics });
});

module.exports = { getStats, getAnalytics };
