const catchAsync = require("../utils/catchAsync");
const serviceService = require("../services/service.service");

const getAll = catchAsync(async (req, res) => {
  const result = await serviceService.getAll();
  res.send(result);
});

const getById = catchAsync(async (req, res) => {
  const result = await serviceService.getById(req.params.id);
  res.send(result);
});

const create = catchAsync(async (req, res) => {
  const result = await serviceService.create(req.body);
  res.send(result);
});

const getInventory = catchAsync(async (req, res) => {
  const result = await serviceService.getBySellerEmail(req.tokenEmail);
  res.send(result);
});

const update = catchAsync(async (req, res) => {
  const existing = await serviceService.getById(req.params.id);
  if (!existing) {
    return res.status(404).send({ message: "Service not found" });
  }
  if (existing.seller?.email !== req.tokenEmail) {
    return res.status(403).send({ message: "Not your service" });
  }
  const result = await serviceService.update(req.params.id, req.body);
  res.send(result);
});

const remove = catchAsync(async (req, res) => {
  const existing = await serviceService.getById(req.params.id);
  if (!existing) {
    return res.status(404).send({ message: "Service not found" });
  }
  if (existing.seller?.email !== req.tokenEmail) {
    return res.status(403).send({ message: "Not your service" });
  }
  const result = await serviceService.remove(req.params.id);
  res.send(result);
});

module.exports = { getAll, getById, create, getInventory, update, remove };
