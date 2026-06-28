const express = require("express");
const { verifyJWT } = require("../middleware/auth.middleware");
const { verifySeller } = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { serviceCreateBody, serviceUpdateBody } = require("../validators");
const serviceController = require("../controllers/service.controller");

const router = express.Router();

router.get("/services", serviceController.getAll);
router.get("/services/:id", serviceController.getById);
router.post(
  "/services",
  verifyJWT,
  verifySeller,
  validate(serviceCreateBody),
  serviceController.create
);
router.patch(
  "/services/:id",
  verifyJWT,
  verifySeller,
  validate(serviceUpdateBody),
  serviceController.update
);
router.delete("/services/:id", verifyJWT, verifySeller, serviceController.remove);
router.get(
  "/my-inventory",
  verifyJWT,
  verifySeller,
  serviceController.getInventory
);

module.exports = router;
