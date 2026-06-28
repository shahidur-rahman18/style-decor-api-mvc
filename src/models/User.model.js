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
    passwordHash: { type: String, default: null },
    authProvider: {
      type: String,
      enum: ["local", "firebase"],
      default: "firebase",
    },
    firebaseUid: { type: String, default: null },
    isEmailVerified: { type: Boolean, default: false },
    created_at: String,
    last_loggedIn: String,
  },
  { collection: "users" }
);

userSchema.index({ firebaseUid: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", userSchema);
