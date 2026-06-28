const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { clientDomain } = require("./config/env");
const connectDB = require("./config/database");
const notFoundHandler = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");
const { authLimiter } = require("./middleware/rateLimit.middleware");
const authRoutes = require("./auth/auth.routes");
const userRoutes = require("./routes/user.routes");
const serviceRoutes = require("./routes/service.routes");
const paymentRoutes = require("./routes/payment.routes");
const orderRoutes = require("./routes/order.routes");
const decoratorRoutes = require("./routes/decorator.routes");

const createApp = () => {
  const app = express();

  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch {
      res.status(503).send({ message: "Service temporarily unavailable" });
    }
  });

  app.use(
    cors({
      origin: [
        clientDomain,
        "https://style-decor-indol.vercel.app",
        "http://localhost:5173",
      ].filter(Boolean),
      credentials: true,
      optionSuccessStatus: 200,
    })
  );
  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Hello from Server..");
  });

  app.get("/health", (req, res) => {
    const state = mongoose.connection.readyState;
    const ok = state === 1;
    res.status(ok ? 200 : 503).send({
      ok,
      db: ["disconnected", "connected", "connecting", "disconnecting"][state],
    });
  });

  app.use(authRoutes);
  app.use(userRoutes);
  app.use(serviceRoutes);
  app.use(paymentRoutes);
  app.use(orderRoutes);
  app.use(decoratorRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
