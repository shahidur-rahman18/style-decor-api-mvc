const catchAsync = require("../utils/catchAsync");
const decoratorService = require("../services/decorator.service");

const createRequest = catchAsync(async (req, res) => {
  const result = await decoratorService.createRequest(req.tokenEmail);
  if (!result) {
    return res.status(409).send({ message: "Already requested, wait koro." });
  }
  res.send(result);
});

const getAll = catchAsync(async (req, res) => {
  const result = await decoratorService.getAll();
  res.send(result);
});

module.exports = { createRequest, getAll };
