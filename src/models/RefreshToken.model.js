const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
    userAgent: String,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "refreshTokens" }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
