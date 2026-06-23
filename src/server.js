require("dotenv").config();
require("./config/env");
require("./config/firebase");

const connectDB = require("./config/database");
const createApp = require("./app");
const { port } = require("./config/env");

connectDB()
  .then(() => {
    const app = createApp();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
