const admin = require("firebase-admin");
const { fbServiceKey } = require("./env");

const serviceAccount = JSON.parse(
  Buffer.from(fbServiceKey, "base64").toString("utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
