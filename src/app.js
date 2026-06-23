const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { clientDomain } = require("./config/env");
const notFoundHandler = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");

const createApp = () => {
  const app = express();

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
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Hello from Server..");
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
