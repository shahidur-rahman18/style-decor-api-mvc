const catchAsync = require("../utils/catchAsync");
const userService = require("../services/user.service");

const saveOrUpdate = catchAsync(async (req, res) => {
  const result = await userService.saveOrUpdate(req.body);
  res.send(result);
});

const getRole = catchAsync(async (req, res) => {
  const result = await userService.getRole(req.tokenEmail);
  res.send(result);
});

const getUsers = catchAsync(async (req, res) => {
  const result = await userService.getUsers(req.tokenEmail);
  res.send(result);
});

const updateRole = catchAsync(async (req, res) => {
  const { email, role } = req.body;
  const result = await userService.updateRole(email, role);
  res.send(result);
});

module.exports = { saveOrUpdate, getRole, getUsers, updateRole };
