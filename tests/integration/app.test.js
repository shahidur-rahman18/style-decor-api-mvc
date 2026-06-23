jest.mock("../../src/config/database", () => jest.fn().mockResolvedValue({}));

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  credential: { cert: jest.fn(() => ({})) },
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

jest.mock("../../src/models/Service.model", () => ({
  find: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue([{ name: "Test Plant", price: 10 }]),
  }),
}));

const request = require("supertest");
const createApp = require("../../src/app");

describe("API smoke tests", () => {
  const app = createApp();

  test("GET / returns health message", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.text).toBe("Hello from Server..");
  });

  test("GET /health reports db status", async () => {
    const res = await request(app).get("/health");

    expect(res.body).toHaveProperty("ok");
    expect(res.body).toHaveProperty("db");
  });

  test("GET /services returns public list", async () => {
    const res = await request(app).get("/services");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ name: "Test Plant", price: 10 }]);
  });

  test("POST /user rejects invalid body", async () => {
    const res = await request(app).post("/user").send({ name: "only-name" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeTruthy();
  });

  test("POST /become-decorator requires auth", async () => {
    const res = await request(app).post("/become-decorator");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized Access!");
  });

  test("unknown route returns 404", async () => {
    const res = await request(app).get("/no-such-route");

    expect(res.status).toBe(404);
  });
});
