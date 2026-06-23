const stripe = require("stripe");
const { stripeSecretKey } = require("./env");

module.exports = stripe(stripeSecretKey);
