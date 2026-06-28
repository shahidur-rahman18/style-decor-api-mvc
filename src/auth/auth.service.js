const User = require("../models/User.model");
const RefreshToken = require("../models/RefreshToken.model");
const admin = require("../config/firebase");
const ApiError = require("../utils/ApiError");
const { refreshTokenExpiryDays } = require("../config/env");
const { hashPassword, comparePassword } = require("./password.service");
const {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require("./token.service");

const toAuthUser = (user) => ({
  email: user.email,
  name: user.name,
  role: user.role,
  image: user.image ?? null,
});

const issueSession = async (user, res, userAgent) => {
  const accessToken = signAccessToken(user);
  const rawRefreshToken = generateRefreshToken();
  const expiresAt = new Date(
    Date.now() + refreshTokenExpiryDays * 24 * 60 * 60 * 1000
  );

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(rawRefreshToken),
    expiresAt,
    userAgent,
  });

  setRefreshTokenCookie(res, rawRefreshToken);

  return { user: toAuthUser(user), accessToken };
};

const register = async ({ name, email, password }, res, userAgent) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "Email already in use");
  }

  const now = new Date().toISOString();
  const user = await User.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    authProvider: "local",
    created_at: now,
    last_loggedIn: now,
  });

  return issueSession(user, res, userAgent);
};

const login = async ({ email, password }, res, userAgent) => {
  const user = await User.findOne({ email });
  if (!user?.passwordHash) {
    throw new ApiError(401, "Invalid email or password");
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password");
  }

  user.last_loggedIn = new Date().toISOString();
  await user.save();

  return issueSession(user, res, userAgent);
};

const findValidRefreshToken = async (rawToken) => {
  if (!rawToken) {
    throw new ApiError(401, "Refresh token required");
  }

  const stored = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });
  if (!stored || stored.isRevoked || stored.expiresAt <= new Date()) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  return stored;
};

const refreshSession = async (refreshTokenRaw, res, userAgent) => {
  const stored = await findValidRefreshToken(refreshTokenRaw);

  const user = await User.findById(stored.userId);
  if (!user) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  stored.isRevoked = true;
  await stored.save();

  const accessToken = signAccessToken(user);
  const rawRefreshToken = generateRefreshToken();
  const expiresAt = new Date(
    Date.now() + refreshTokenExpiryDays * 24 * 60 * 60 * 1000
  );

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(rawRefreshToken),
    expiresAt,
    userAgent,
  });

  setRefreshTokenCookie(res, rawRefreshToken);

  return { accessToken, user: toAuthUser(user) };
};

const logout = async (refreshTokenRaw, res) => {
  if (refreshTokenRaw) {
    await RefreshToken.updateOne(
      { tokenHash: hashToken(refreshTokenRaw), isRevoked: false },
      { isRevoked: true }
    );
  }

  clearRefreshTokenCookie(res);
};

const logoutAll = async (userId) => {
  await RefreshToken.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true }
  );
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return { user: toAuthUser(user) };
};

const firebaseSync = async (firebaseIdToken, res, userAgent) => {
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(firebaseIdToken);
  } catch {
    throw new ApiError(401, "Invalid Firebase token");
  }

  const { uid, email, name, picture, email_verified: isEmailVerified } =
    decoded;
  if (!email) {
    throw new ApiError(400, "Firebase account must have an email");
  }

  const now = new Date().toISOString();
  let user = await User.findOne({ firebaseUid: uid });

  if (!user) {
    user = await User.findOne({ email });
  }

  if (user) {
    user.firebaseUid = uid;
    user.name = name || user.name;
    user.image = picture ?? user.image;
    user.last_loggedIn = now;
    user.isEmailVerified = isEmailVerified ?? user.isEmailVerified;
    await user.save();
  } else {
    user = await User.create({
      email,
      name: name || email.split("@")[0],
      image: picture ?? null,
      authProvider: "firebase",
      firebaseUid: uid,
      isEmailVerified: isEmailVerified ?? false,
      created_at: now,
      last_loggedIn: now,
    });
  }

  return issueSession(user, res, userAgent);
};

module.exports = {
  register,
  login,
  issueSession,
  refreshSession,
  logout,
  logoutAll,
  getMe,
  firebaseSync,
};
