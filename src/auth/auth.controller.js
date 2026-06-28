const catchAsync = require("../utils/catchAsync");
const authService = require("./auth.service");
const { REFRESH_COOKIE_NAME } = require("./token.service");
const ApiError = require("../utils/ApiError");

const register = catchAsync(async (req, res) => {
  const result = await authService.register(
    req.body,
    res,
    req.get("user-agent")
  );
  res.status(201).send(result);
});

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body, res, req.get("user-agent"));
  res.send(result);
});

const refresh = catchAsync(async (req, res) => {
  const result = await authService.refreshSession(
    req.cookies?.[REFRESH_COOKIE_NAME],
    res,
    req.get("user-agent")
  );
  res.send(result);
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE_NAME], res);
  res.send({ message: "Logged out successfully" });
});

const logoutAll = catchAsync(async (req, res) => {
  await authService.logoutAll(req.user.id);
  await authService.logout(req.cookies?.[REFRESH_COOKIE_NAME], res);
  res.send({ message: "Logged out from all devices" });
});

const getMe = catchAsync(async (req, res) => {
  const result = await authService.getMe(req.user.id);
  res.send(result);
});

const firebaseSync = catchAsync(async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new ApiError(401, "Unauthorized Access!");
  }

  const result = await authService.firebaseSync(
    token,
    res,
    req.get("user-agent")
  );
  res.send(result);
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  firebaseSync,
};
