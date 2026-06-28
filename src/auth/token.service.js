const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const {
  jwtAccessSecret,
  accessTokenExpiry,
  refreshTokenExpiryDays,
  cookieDomain,
  isProduction,
} = require("../config/env");

const REFRESH_COOKIE_NAME = "refreshToken";

const signAccessToken = (user) => {
  const payload = {
    sub: user._id?.toString() || user.id,
    email: user.email,
    role: user.role,
    provider: user.authProvider,
  };

  return jwt.sign(payload, jwtAccessSecret, { expiresIn: accessTokenExpiry });
};

const verifyAccessToken = (token) => jwt.verify(token, jwtAccessSecret);

const generateRefreshToken = () => crypto.randomBytes(64).toString("hex");

const hashToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: "/auth/refresh",
  maxAge: refreshTokenExpiryDays * 24 * 60 * 60 * 1000,
  domain: cookieDomain,
});

const setRefreshTokenCookie = (res, rawToken) => {
  res.cookie(REFRESH_COOKIE_NAME, rawToken, getRefreshCookieOptions());
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
};

module.exports = {
  REFRESH_COOKIE_NAME,
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
