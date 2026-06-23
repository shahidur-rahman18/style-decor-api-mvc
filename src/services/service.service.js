const mongoose = require("mongoose");
const Service = require("../models/Service.model");

const getAll = () => Service.find().lean();

const getById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Service.findById(id).lean();
};

const create = async (data) => {
  const doc = await Service.create(data);
  return { acknowledged: true, insertedId: doc._id };
};

const getBySellerEmail = (email) =>
  Service.find({ "seller.email": email }).lean();

const update = (id, data) =>
  Service.updateOne({ _id: id }, { $set: data });

const remove = (id) => Service.deleteOne({ _id: id });

module.exports = { getAll, getById, create, getBySellerEmail, update, remove };
