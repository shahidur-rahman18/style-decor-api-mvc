require("dotenv").config();
require("./config/env");

const createApp = require("./app");
const { port } = require("./config/env");

const app = createApp();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
