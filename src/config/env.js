const required = [
  "MONGODB_URI",
  "STRIPE_SECRET_KEY",
  "FB_SERVICE_KEY",
  "CLIENT_DOMAIN",
  "JWT_ACCESS_SECRET",
];

for (const key of required) {
  if (!process.env[key]?.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const nodeEnv = process.env.NODE_ENV?.trim() || "development";

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongodbUri: process.env.MONGODB_URI,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  fbServiceKey: process.env.FB_SERVICE_KEY,
  clientDomain: process.env.CLIENT_DOMAIN.trim(),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET.trim(),
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY?.trim() || "15m",
  refreshTokenExpiryDays: Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS) || 7,
  cookieDomain: process.env.COOKIE_DOMAIN?.trim() || "localhost",
  nodeEnv,
  isProduction: nodeEnv === "production",
  isVercel: Boolean(process.env.VERCEL),
};
