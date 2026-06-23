const mongoose = require("mongoose");
const Order = require("../models/Order.model");

const getByCustomer = (email) => Order.find({ customer: email }).lean();

const getBySeller = (email) => Order.find({ "seller.email": email }).lean();

const getById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Order.findById(id).lean();
};

const updateStatus = (id, status) =>
  Order.updateOne({ _id: id }, { $set: { status } });

const remove = (id) => Order.deleteOne({ _id: id });

module.exports = { getByCustomer, getBySeller, getById, updateStatus, remove };
