const stripe = require("../config/stripe");
const { clientDomain } = require("../config/env");
const Service = require("../models/Service.model");
const Order = require("../models/Order.model");

const createCheckoutSession = async (paymentInfo) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: paymentInfo?.name,
            description: paymentInfo?.description,
            images: [paymentInfo.image],
          },
          unit_amount: paymentInfo?.price * 100,
        },
        quantity: paymentInfo?.quantity,
      },
    ],
    customer_email: paymentInfo?.customer?.email,
    mode: "payment",
    metadata: {
      serviceId: paymentInfo?.serviceId,
      customer: paymentInfo?.customer.email,
    },
    success_url: `${clientDomain}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientDomain}/service/${paymentInfo?.serviceId}`,
  });

  return { url: session.url };
};

const handlePaymentSuccess = async (sessionId) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const service = await Service.findById(session.metadata?.serviceId).lean();
  const existing = await Order.findOne({
    transactionId: session.payment_intent,
  }).lean();

  const paid =
    session.payment_status === "paid" || session.status === "complete";

  if (paid && service && !existing) {
    const doc = await Order.create({
      serviceId: session.metadata.serviceId,
      transactionId: session.payment_intent,
      customer: session.metadata.customer,
      status: "pending",
      seller: service.seller,
      name: service.name,
      category: service.category,
      quantity: 1,
      price: session.amount_total / 100,
      image: service?.image,
    });

    await Service.updateOne(
      { _id: session.metadata.serviceId },
      { $inc: { quantity: -1 } }
    );

    return { transactionId: session.payment_intent, orderId: doc._id };
  }

  if (existing) {
    return {
      transactionId: session.payment_intent,
      orderId: existing._id,
    };
  }

  return { error: true, session };
};

module.exports = { createCheckoutSession, handlePaymentSuccess };
