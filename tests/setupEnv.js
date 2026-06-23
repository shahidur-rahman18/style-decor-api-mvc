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
