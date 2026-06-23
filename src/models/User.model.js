const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: String,
    image: String,
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
    created_at: String,
    last_loggedIn: String,
  },
  { collection: "users" }
);

module.exports = mongoose.model("User", userSchema);
