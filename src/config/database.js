const mongoose = require("mongoose");
const { mongodbUri } = require("./env");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongodbUri, {
      dbName: "styleDecorDB",
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
