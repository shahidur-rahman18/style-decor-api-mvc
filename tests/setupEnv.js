process.env.MONGODB_URI = "mongodb://127.0.0.1/style-decor-test";
process.env.STRIPE_SECRET_KEY = "sk_test_fake";
process.env.FB_SERVICE_KEY = Buffer.from(
  JSON.stringify({
    project_id: "test",
    private_key:
      "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n",
    client_email: "test@test.iam.gserviceaccount.com",
  })
).toString("base64");
process.env.CLIENT_DOMAIN = "http://localhost:5173";
process.env.JWT_ACCESS_SECRET = "test-jwt-access-secret-for-unit-tests-only";
process.env.ACCESS_TOKEN_EXPIRY = "15m";
process.env.REFRESH_TOKEN_EXPIRY_DAYS = "7";
process.env.COOKIE_DOMAIN = "localhost";
process.env.NODE_ENV = "test";
