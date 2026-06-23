const DecoratorRequest = require("../models/DecoratorRequest.model");

const createRequest = async (email) => {
  const existing = await DecoratorRequest.findOne({ email });
  if (existing) return null;

  const doc = await DecoratorRequest.create({ email });
  return { acknowledged: true, insertedId: doc._id };
};

const getAll = () => DecoratorRequest.find().lean();

module.exports = { createRequest, getAll };
