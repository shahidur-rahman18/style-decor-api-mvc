const mongoose = require("mongoose");

const decoratorRequestSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
  },
  { collection: "decoratorRequests" }
);

module.exports = mongoose.model("DecoratorRequest", decoratorRequestSchema);
