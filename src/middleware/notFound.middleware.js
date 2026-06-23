const notFoundHandler = (req, res) => {
  res.status(404).send({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

module.exports = notFoundHandler;
