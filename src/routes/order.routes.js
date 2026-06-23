const express = require("express");
const { verifyJWT } = require("../middleware/auth.middleware");
const { verifySeller } = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { orderStatusBody } = require("../validators");
const orderController = require("../controllers/order.controller");

const router = express.Router();

router.get("/my-orders", verifyJWT, orderController.getMyOrders);
router.get(
  "/manage-orders/:email",
  verifyJWT,
  verifySeller,
  orderController.getManageOrders
);
router.patch(
  "/orders/status/:id",
  verifyJWT,
  validate(orderStatusBody),
  orderController.updateStatus
);
router.delete("/orders/:id", verifyJWT, orderController.remove);

module.exports = router;
