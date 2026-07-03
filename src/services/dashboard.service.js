const Order = require("../models/Order.model");
const Service = require("../models/Service.model");
const User = require("../models/User.model");
const DecoratorRequest = require("../models/DecoratorRequest.model");
const mongoose = require("mongoose");

const getMonthRange = (monthsAgo = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return { start, end };
};

const getObjectIdFromDate = (date) => {
  const hex = Math.floor(date.getTime() / 1000).toString(16);
  return new mongoose.Types.ObjectId(hex + "0000000000000000");
};

const getPeriodDays = (period) => {
  const map = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
  return map[period] || 30;
};

const calcGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const getRevenueForMonth = async (matchStage, monthsAgo) => {
  const { start, end } = getMonthRange(monthsAgo);
  const startId = getObjectIdFromDate(start);
  const endId = getObjectIdFromDate(end);

  const result = await Order.aggregate([
    {
      $match: {
        ...matchStage,
        _id: { $gte: startId, $lt: endId },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: { $multiply: ["$price", "$quantity"] } },
        count: { $sum: 1 },
      },
    },
  ]);

  return { revenue: result[0]?.revenue || 0, count: result[0]?.count || 0 };
};

// ─── Admin Stats ───
const getAdminStats = async () => {
  const [
    totalRevenue,
    totalOrders,
    totalServices,
    totalUsers,
    pendingOrders,
    pendingRequests,
    currentMonth,
    prevMonth,
    recentOrders,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$quantity"] } } } },
    ]),
    Order.countDocuments(),
    Service.countDocuments(),
    User.countDocuments(),
    Order.countDocuments({ status: "pending" }),
    DecoratorRequest.countDocuments(),
    getRevenueForMonth({}, 0),
    getRevenueForMonth({}, 1),
    Order.find().sort({ _id: -1 }).limit(5).lean(),
  ]);

  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    totalOrders,
    totalServices,
    totalUsers,
    pendingOrders,
    pendingDecoratorRequests: pendingRequests,
    revenueGrowth: calcGrowth(currentMonth.revenue, prevMonth.revenue),
    ordersGrowth: calcGrowth(currentMonth.count, prevMonth.count),
    recentOrders,
  };
};

// ─── Seller Stats ───
const getSellerStats = async (email) => {
  const sellerMatch = { "seller.email": email };

  const [
    totalRevenue,
    totalOrders,
    totalServices,
    pendingOrders,
    currentMonth,
    prevMonth,
    recentOrders,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { ...sellerMatch, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$quantity"] } } } },
    ]),
    Order.countDocuments(sellerMatch),
    Service.countDocuments({ "seller.email": email }),
    Order.countDocuments({ ...sellerMatch, status: "pending" }),
    getRevenueForMonth(sellerMatch, 0),
    getRevenueForMonth(sellerMatch, 1),
    Order.find(sellerMatch).sort({ _id: -1 }).limit(5).lean(),
  ]);

  return {
    myRevenue: totalRevenue[0]?.total || 0,
    myTotalOrders: totalOrders,
    myServices: totalServices,
    pendingOrders,
    revenueGrowth: calcGrowth(currentMonth.revenue, prevMonth.revenue),
    ordersGrowth: calcGrowth(currentMonth.count, prevMonth.count),
    recentOrders,
  };
};

// ─── Customer Stats ───
const getCustomerStats = async (email) => {
  const customerMatch = { customer: email };

  const [
    totalSpent,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    recentOrders,
    currentMonth,
    prevMonth,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { ...customerMatch, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$quantity"] } } } },
    ]),
    Order.countDocuments(customerMatch),
    Order.countDocuments({ ...customerMatch, status: "pending" }),
    Order.countDocuments({ ...customerMatch, status: "delivered" }),
    Order.find(customerMatch).sort({ _id: -1 }).limit(5).lean(),
    getRevenueForMonth(customerMatch, 0),
    getRevenueForMonth(customerMatch, 1),
  ]);

  return {
    totalSpent: totalSpent[0]?.total || 0,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    spendingGrowth: calcGrowth(currentMonth.revenue, prevMonth.revenue),
    recentOrders,
  };
};

// ─── Analytics (chart data) ───
const getAnalytics = async (email, role, period = "30d") => {
  const days = getPeriodDays(period);
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceId = getObjectIdFromDate(sinceDate);

  let matchStage = { _id: { $gte: sinceId } };
  if (role === "seller") matchStage["seller.email"] = email;
  if (role === "customer") matchStage.customer = email;

  const dateExpr = {
    $toDate: "$_id",
  };

  const [monthlyRevenue, monthlyBookings, categoryBreakdown, statusBreakdown] =
    await Promise.all([
      Order.aggregate([
        { $match: { ...matchStage, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: {
              year: { $year: dateExpr },
              month: { $month: dateExpr },
            },
            revenue: { $sum: { $multiply: ["$price", "$quantity"] } },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            revenue: 1,
          },
        },
      ]),

      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              year: { $year: dateExpr },
              month: { $month: dateExpr },
            },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            bookings: 1,
          },
        },
      ]),

      Order.aggregate([
        { $match: matchStage },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $project: { _id: 0, category: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),

      Order.aggregate([
        { $match: matchStage },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),
    ]);

  return { monthlyRevenue, monthlyBookings, categoryBreakdown, statusBreakdown };
};

module.exports = {
  getAdminStats,
  getSellerStats,
  getCustomerStats,
  getAnalytics,
};
