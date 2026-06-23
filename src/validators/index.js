const { z } = require("zod");

const userBody = z
  .object({
    email: z.string().email(),
  })
  .passthrough();

const updateRoleBody = z.object({
  email: z.string().email(),
  role: z.enum(["customer", "seller", "admin"]),
});

const serviceCreateBody = z
  .object({
    name: z.string().min(1),
    price: z.number(),
    quantity: z.number(),
  })
  .passthrough();

const serviceUpdateBody = z.object({}).passthrough();

const checkoutBody = z
  .object({
    serviceId: z.string().min(1),
    name: z.string().min(1),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
    customer: z.object({
      email: z.string().email(),
    }),
  })
  .passthrough();

const paymentSuccessBody = z.object({
  sessionId: z.string().min(1),
});

const orderStatusBody = z.object({
  status: z.string().min(1),
});

module.exports = {
  userBody,
  updateRoleBody,
  serviceCreateBody,
  serviceUpdateBody,
  checkoutBody,
  paymentSuccessBody,
  orderStatusBody,
};
