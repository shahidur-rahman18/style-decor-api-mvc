require("dotenv").config();
require("./config/env");
require("./config/firebase");

module.exports = require("./app")();
