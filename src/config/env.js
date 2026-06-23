const required = ["MONGODB_URI", "STRIPE_SECRET_KEY", "FB_SERVICE_KEY", "CLIENT_DOMAIN"];

for (const key of required) {
  if (!process.env[key]?.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongodbUri: process.env.MONGODB_URI,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  fbServiceKey: process.env.FB_SERVICE_KEY,
  clientDomain: process.env.CLIENT_DOMAIN.trim(),
  isVercel: Boolean(process.env.VERCEL),
};
