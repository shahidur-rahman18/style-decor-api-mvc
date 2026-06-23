const catchAsync = require("../utils/catchAsync");
const paymentService = require("../services/payment.service");

const createCheckout = catchAsync(async (req, res) => {
  const result = await paymentService.createCheckoutSession(req.body);
  res.send(result);
});

const paymentSuccess = catchAsync(async (req, res) => {
  const result = await paymentService.handlePaymentSuccess(req.body.sessionId);

  if (result.error) {
    return res.status(400).send({
      message:
        "No new order created. Payment not confirmed or service missing on session metadata.",
      session: result.session,
    });
  }

  res.send(result);
});

module.exports = { createCheckout, paymentSuccess };
