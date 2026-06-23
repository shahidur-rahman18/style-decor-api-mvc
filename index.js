require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("./src/config/env");
const stripe = require("./src/config/stripe");
require("./src/config/firebase");
const { clientDomain, port, isVercel } = require("./src/config/env");
const { verifyJWT } = require("./src/middleware/auth.middleware");
const {
  createVerifyAdmin,
  createVerifySeller,
} = require("./src/middleware/role.middleware");

const app = express();
app.use(
  cors({
    origin: [
      clientDomain,
      "https://style-decor-indol.vercel.app",
      "http://localhost:5173",
    ].filter(Boolean),
    credentials: true,
    optionSuccessStatus: 200,
  })
);
app.use(helmet());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();

    app.get("/", (req, res) => {
      res.send("Hello from Server..");
    });

    const db = client.db("styleDecorDB");
    const servicesCollection = db.collection("services");
    const ordersCollection = db.collection("orders");
    const usersCollection = db.collection("users");
    const decoratorRequestsCollection = db.collection("decoratorRequests");

    const verifyADMIN = createVerifyAdmin(usersCollection);
    const verifySELLER = createVerifySeller(usersCollection);

    // Save a services data in db
    app.post("/services", verifyJWT, verifySELLER, async (req, res) => {
      const serviceData = req.body;
      console.log(serviceData);
      const result = await servicesCollection.insertOne(serviceData);
      res.send(result);
    });

    // get all services from db
    app.get("/services", async (req, res) => {
      const result = await servicesCollection.find().toArray();
      res.send(result);
    });
    // get all  services from db
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const result = await servicesCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Payment endpoints
    app.post("/create-checkout-session", async (req, res) => {
      const paymentInfo = req.body;
      console.log(paymentInfo);
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
        // Accept either `serviceId` or legacy `plantId` (frontend used `plantId` before)
        metadata: {
          serviceId: paymentInfo?.serviceId,
          customer: paymentInfo?.customer.email,
        },
        success_url: `${clientDomain}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientDomain}/service/${paymentInfo?.serviceId}`,
      });
      res.send({ url: session.url });
    });

    app.post("/payment-success", async (req, res) => {
      const { sessionId } = req.body;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log("payment-success: retrieved session", session.id);
      // find service using metadata.serviceId (introduced above in session creation)
      const service = await servicesCollection.findOne({
        _id: new ObjectId(session.metadata?.serviceId),
      });
      const order = await ordersCollection.findOne({
        transactionId: session.payment_intent,
      });

      // Stripe may report either `payment_status: 'paid'` or `status: 'complete'`
      const paid =
        session.payment_status === "paid" || session.status === "complete";

      if (paid && service && !order) {
        // save order data in db
        const orderInfo = {
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
        };
        const result = await ordersCollection.insertOne(orderInfo);
        console.log("payment-success: inserted order", result.insertedId);
        // update service quantity
        await servicesCollection.updateOne(
          {
            _id: new ObjectId(session.metadata.serviceId),
          },
          { $inc: { quantity: -1 } }
        );

        return res.send({
          transactionId: session.payment_intent,
          orderId: result.insertedId,
        });
      }
      // If an order already exists, return it; otherwise return a helpful message
      if (order) {
        return res.send({
          transactionId: session.payment_intent,
          orderId: order._id,
        });
      }

      console.log("payment-success: no order created for session", session.id);
      return res.status(400).send({
        message:
          "No new order created. Payment not confirmed or service missing on session metadata.",
        session,
      });
    });

    // get all orders for a customer by email
    app.get("/my-orders", verifyJWT, async (req, res) => {
      const result = await ordersCollection
        .find({ customer: req.tokenEmail })
        .toArray();
      res.send(result);
    });

    // get all orders for a seller by email from order collection
    app.get(
      "/manage-orders/:email",
      verifyJWT,
      verifySELLER,
      async (req, res) => {
        const email = req.params.email;

        const result = await ordersCollection
          .find({ "seller.email": email })
          .toArray();
        res.send(result);
      }
    );

    // update order status
    app.patch("/orders/status/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;

      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );

      res.send(result);
    });

    // delete order
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;

      const result = await ordersCollection.deleteOne({
        _id: new ObjectId(id),
      });

      if (result.deletedCount === 0) {
        return res.status(404).send({ message: "Order not found" });
      }

      res.send(result);
    });

    // get all plants for a seller by email from serviceCollection
    app.get(
      "/my-inventory/:email",
      verifyJWT,
      verifySELLER,
      async (req, res) => {
        const email = req.params.email;

        const result = await servicesCollection
          .find({ "seller.email": email })
          .toArray();
        res.send(result);
      }
    );

    // DELETE SERVICE BY ID with verification
    app.delete("/services/:id", verifyJWT, verifySELLER, async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await servicesCollection.deleteOne(query);

      res.send(result);
    });

    // UPDATE SERVICE
    app.patch("/services/:id", verifyJWT, verifySELLER, async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedData,
      };

      const result = await servicesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // save or update a user in db
    app.post("/user", async (req, res) => {
      const userData = req.body;
      userData.created_at = new Date().toISOString();
      userData.last_loggedIn = new Date().toISOString();
      userData.role = "customer";

      const query = {
        email: userData.email,
      };

      const alreadyExists = await usersCollection.findOne(query);
      console.log("User Already Exists---> ", !!alreadyExists);

      if (alreadyExists) {
        console.log("Updating user info......");
        const result = await usersCollection.updateOne(query, {
          $set: {
            last_loggedIn: new Date().toISOString(),
          },
        });
        return res.send(result);
      }

      console.log("Saving new user info......");
      const result = await usersCollection.insertOne(userData);
      res.send(result);
    });
    // get a user's role
    app.get("/user/role", verifyJWT, async (req, res) => {
      const result = await usersCollection.findOne({ email: req.tokenEmail });
      res.send({ role: result?.role });
    });

    // save become-seller request
    app.post("/become-decorator", verifyJWT, async (req, res) => {
      const email = req.tokenEmail;
      const alreadyExists = await decoratorRequestsCollection.findOne({
        email,
      });
      if (alreadyExists)
        return res
          .status(409)
          .send({ message: "Already requested, wait koro." });

      const result = await decoratorRequestsCollection.insertOne({ email });
      res.send(result);
    });

    // get all seller requests for admin
    app.get("/decorator-requests", verifyJWT, verifyADMIN, async (req, res) => {
      const result = await decoratorRequestsCollection.find().toArray();
      res.send(result);
    });

    // get all users for admin
    app.get("/users", verifyJWT, verifyADMIN, async (req, res) => {
      const adminEmail = req.tokenEmail;
      const result = await usersCollection
        .find({ email: { $ne: adminEmail } })
        .toArray();
      res.send(result);
    });

    // update a user's role
    app.patch("/update-role", verifyJWT, verifyADMIN, async (req, res) => {
      const { email, role } = req.body;
      const result = await usersCollection.updateOne(
        { email },
        { $set: { role } }
      );
      await decoratorRequestsCollection.deleteOne({ email });

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
const initPromise = run().catch((err) => {
  console.error("Failed to initialize server:", err);
  throw err;
});

app.use(async (req, res, next) => {
  try {
    await initPromise;
    next();
  } catch (err) {
    res.status(503).send({ message: "Service temporarily unavailable" });
  }
});

module.exports = app;

if (!isVercel) {
  initPromise.then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  });
}
