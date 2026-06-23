const User = require("../models/User.model");
const DecoratorRequest = require("../models/DecoratorRequest.model");

const saveOrUpdate = async (userData) => {
  const now = new Date().toISOString();
  const existing = await User.findOne({ email: userData.email });

  if (existing) {
    return User.updateOne(
      { email: userData.email },
      { $set: { last_loggedIn: now } }
    );
  }

  const user = await User.create({
    ...userData,
    created_at: now,
    last_loggedIn: now,
    role: "customer",
  });

  return { acknowledged: true, insertedId: user._id };
};

const getRole = async (email) => {
  const user = await User.findOne({ email }).lean();
  return { role: user?.role };
};

const getUsers = async (adminEmail) => {
  return User.find({ email: { $ne: adminEmail } }).lean();
};

const updateRole = async (email, role) => {
  const result = await User.updateOne({ email }, { $set: { role } });
  await DecoratorRequest.deleteOne({ email });
  return result;
};

module.exports = { saveOrUpdate, getRole, getUsers, updateRole };
