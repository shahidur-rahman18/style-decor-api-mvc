const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    image: String,
    name: String,
    email: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    serviceId: String,
    transactionId: { type: String, unique: true, sparse: true },
    customer: String,
    status: {
      type: String,
      enum: ["pending", "processing", "delivered", "cancelled"],
      default: "pending",
    },
    seller: sellerSchema,
    name: String,
    category: String,
    quantity: Number,
    price: Number,
    image: String,
  },
  { collection: "orders", strict: false }
);

module.exports = mongoose.model("Order", orderSchema);
