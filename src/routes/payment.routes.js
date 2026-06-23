const express = require("express");
const validate = require("../middleware/validate.middleware");
const { checkoutBody, paymentSuccessBody } = require("../validators");
const paymentController = require("../controllers/payment.controller");

const router = express.Router();

router.post(
  "/create-checkout-session",
  validate(checkoutBody),
  paymentController.createCheckout
);
router.post(
  "/payment-success",
  validate(paymentSuccessBody),
  paymentController.paymentSuccess
);
module.exports = router;
