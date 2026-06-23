const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).send({
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
  });
};

module.exports = errorHandler;
