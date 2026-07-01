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

  test("GET / returns API docs page", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("Style Decor API");
    expect(res.text).toContain("/auth/login");
    expect(res.text).toContain("/services");
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

  test("POST /user removed — use /auth/register or /auth/firebase-sync", async () => {
    const res = await request(app)
      .post("/user")
      .send({ name: "Test", email: "test@example.com" });

    expect(res.status).toBe(404);
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
