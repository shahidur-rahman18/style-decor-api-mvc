const catchAsync = require("../utils/catchAsync");
const User = require("../models/User.model");
const orderService = require("../services/order.service");

const getMyOrders = catchAsync(async (req, res) => {
  const result = await orderService.getByCustomer(req.tokenEmail);
  res.send(result);
});

const getManageOrders = catchAsync(async (req, res) => {
  const result = await orderService.getBySeller(req.tokenEmail);
  res.send(result);
});

const canManageOrder = async (order, tokenEmail) => {
  const user = await User.findOne({ email: tokenEmail }).lean();
  if (user?.role === "admin") return true;
  return order.seller?.email === tokenEmail;
};

const updateStatus = catchAsync(async (req, res) => {
  const order = await orderService.getById(req.params.id);
  if (!order) {
    return res.status(404).send({ message: "Order not found" });
  }
  if (!(await canManageOrder(order, req.tokenEmail))) {
    return res.status(403).send({ message: "Not allowed" });
  }

  const result = await orderService.updateStatus(
    req.params.id,
    req.body.status
  );
  res.send(result);
});

const remove = catchAsync(async (req, res) => {
  const order = await orderService.getById(req.params.id);
  if (!order) {
    return res.status(404).send({ message: "Order not found" });
  }
  if (!(await canManageOrder(order, req.tokenEmail))) {
    return res.status(403).send({ message: "Not allowed" });
  }

  const result = await orderService.remove(req.params.id);
  if (result.deletedCount === 0) {
    return res.status(404).send({ message: "Order not found" });
  }
  res.send(result);
});

module.exports = { getMyOrders, getManageOrders, updateStatus, remove };
