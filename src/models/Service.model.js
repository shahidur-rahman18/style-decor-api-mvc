const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    image: String,
    name: String,
    email: String,
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    category: String,
    image: String,
    price: Number,
    quantity: Number,
    seller: sellerSchema,
  },
  { collection: "services", strict: false, timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);
