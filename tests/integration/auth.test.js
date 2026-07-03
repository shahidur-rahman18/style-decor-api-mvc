jest.mock("../../src/config/database", () => jest.fn().mockResolvedValue({}));

jest.mock("../../src/middleware/rateLimit.middleware", () => ({
  authLimiter: (_req, _res, next) => next(),
  authStrictLimiter: (_req, _res, next) => next(),
}));

jest.mock("../../src/models/Service.model", () => ({
  find: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue([]),
  }),
}));

const mockVerifyIdToken = jest.fn();

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  credential: { cert: jest.fn(() => ({})) },
  auth: jest.fn(() => ({
    verifyIdToken: (...args) => mockVerifyIdToken(...args),
  })),
}));

const mockUsersById = new Map();
const mockUsersByEmail = new Map();
const mockUsersByFirebaseUid = new Map();
const mockRefreshTokensByHash = new Map();

const persistUser = (user) => {
  mockUsersById.set(String(user._id), user);
  mockUsersByEmail.set(user.email, user);
  if (user.firebaseUid) {
    mockUsersByFirebaseUid.set(user.firebaseUid, user);
  }
};

const createUserDoc = (data) => {
  const doc = {
    _id: data._id || String(mockUsersById.size + 1),
    email: data.email,
    name: data.name,
    role: data.role || "customer",
    image: data.image ?? null,
    authProvider: data.authProvider || "local",
    passwordHash: data.passwordHash ?? null,
    firebaseUid: data.firebaseUid ?? null,
    isEmailVerified: data.isEmailVerified ?? false,
    last_loggedIn: data.last_loggedIn,
    save: jest.fn(async function saveUser() {
      persistUser(this);
      return this;
    }),
  };
  persistUser(doc);
  return doc;
};

const mockFindOneQuery = (query) => {
  const resolveUser = async () => {
    if (query.email) return mockUsersByEmail.get(query.email) || null;
    if (query.firebaseUid) return mockUsersByFirebaseUid.get(query.firebaseUid) || null;
    return null;
  };

  return {
    lean: jest.fn(() => resolveUser()),
    then: (onFulfilled, onRejected) => resolveUser().then(onFulfilled, onRejected),
  };
};

jest.mock("../../src/models/User.model", () => ({
  findOne: jest.fn((query) => mockFindOneQuery(query)),
  findById: jest.fn(async (id) => mockUsersById.get(String(id)) || null),
  create: jest.fn(async (data) => createUserDoc(data)),
  find: jest.fn((query) => ({
    lean: jest.fn(async () => {
      const users = Array.from(mockUsersByEmail.values());
      if (query?.email?.$ne) {
        return users.filter((user) => user.email !== query.email.$ne);
      }
      return users;
    }),
  })),
}));

jest.mock("../../src/models/RefreshToken.model", () => ({
  create: jest.fn(async (data) => {
    const doc = {
      ...data,
      isRevoked: data.isRevoked ?? false,
      save: jest.fn(async function saveToken() {
        mockRefreshTokensByHash.set(this.tokenHash, this);
        return this;
      }),
    };
    mockRefreshTokensByHash.set(doc.tokenHash, doc);
    return doc;
  }),
  findOne: jest.fn(async (query) => {
    if (query.tokenHash) return mockRefreshTokensByHash.get(query.tokenHash) || null;
    return null;
  }),
  updateOne: jest.fn(async (filter, update) => {
    const token = mockRefreshTokensByHash.get(filter.tokenHash);
    if (token && filter.isRevoked === false && update.isRevoked) {
      token.isRevoked = true;
    }
  }),
  updateMany: jest.fn(async (filter, update) => {
    for (const token of mockRefreshTokensByHash.values()) {
      if (
        String(token.userId) === String(filter.userId) &&
        filter.isRevoked === false &&
        update.isRevoked
      ) {
        token.isRevoked = true;
      }
    }
  }),
}));

const jwt = require("jsonwebtoken");
const request = require("supertest");
const createApp = require("../../src/app");
const { hashToken } = require("../../src/auth/token.service");

const TEST_USER = {
  name: "Test User",
  email: "auth-test@example.com",
  password: "Test1234",
};

const getRefreshCookiePair = (res) => {
  const cookieHeader = res.headers["set-cookie"]?.find((cookie) =>
    cookie.startsWith("refreshToken=")
  );
  return cookieHeader?.split(";")[0];
};

const getRefreshCookieValue = (res) => getRefreshCookiePair(res)?.split("=")[1];

const clearStores = () => {
  mockUsersById.clear();
  mockUsersByEmail.clear();
  mockUsersByFirebaseUid.clear();
  mockRefreshTokensByHash.clear();
  mockVerifyIdToken.mockReset();
};

describe("Auth integration (B9)", () => {
  const app = createApp();

  beforeEach(() => {
    clearStores();
  });

  test("register with email/password → 201 + accessToken + cookie", async () => {
    const res = await request(app).post("/auth/register").send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      email: TEST_USER.email,
      name: TEST_USER.name,
      role: "customer",
    });
    expect(res.headers["set-cookie"]?.join(";")).toMatch(/refreshToken=/);
  });

  test("login with wrong password → 401", async () => {
    await request(app).post("/auth/register").send(TEST_USER);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: TEST_USER.email, password: "WrongPass1" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });

  test("login with correct credentials → 200 + tokens", async () => {
    await request(app).post("/auth/register").send(TEST_USER);

    const res = await request(app).post("/auth/login").send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(TEST_USER.email);
    expect(res.headers["set-cookie"]?.join(";")).toMatch(/refreshToken=/);
  });

  test("protected route with accessToken → 200", async () => {
    const registerRes = await request(app).post("/auth/register").send(TEST_USER);

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${registerRes.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_USER.email);
  });

  test("protected route with expired accessToken → 401", async () => {
    const expiredToken = jwt.sign(
      {
        sub: "1",
        email: TEST_USER.email,
        role: "customer",
        provider: "local",
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "-1s" }
    );

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized Access!");
  });

  test("refresh with valid cookie → new accessToken + rotated cookie", async () => {
    const registerRes = await request(app).post("/auth/register").send(TEST_USER);
    const firstCookie = registerRes.headers["set-cookie"];

    const refreshRes = await request(app)
      .post("/auth/refresh")
      .set("Cookie", getRefreshCookiePair(registerRes));

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toEqual(expect.any(String));
    expect(getRefreshCookieValue(refreshRes)).not.toBe(
      getRefreshCookieValue(registerRes)
    );
    expect(refreshRes.headers["set-cookie"]).toBeDefined();
    expect(refreshRes.headers["set-cookie"]).not.toEqual(firstCookie);
  });

  test("refresh with revoked cookie → 401", async () => {
    const registerRes = await request(app).post("/auth/register").send(TEST_USER);
    const cookiePair = getRefreshCookiePair(registerRes);

    await request(app).post("/auth/logout").set("Cookie", cookiePair);

    const refreshRes = await request(app)
      .post("/auth/refresh")
      .set("Cookie", cookiePair);

    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body.message).toMatch(/refresh token/i);
  });

  test("logout → cookie cleared, refresh token revoked", async () => {
    const registerRes = await request(app).post("/auth/register").send(TEST_USER);
    const cookiePair = getRefreshCookiePair(registerRes);
    const rawCookie = getRefreshCookieValue(registerRes);

    const logoutRes = await request(app)
      .post("/auth/logout")
      .set("Cookie", cookiePair);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.headers["set-cookie"]?.join(";")).toMatch(/refreshToken=/);
    expect(mockRefreshTokensByHash.get(hashToken(rawCookie))?.isRevoked).toBe(true);
  });

  test("firebase sync with valid token → 200 + custom JWT + cookie", async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: "firebase-uid-1",
      email: "google@example.com",
      name: "Google User",
      picture: "https://example.com/photo.jpg",
      email_verified: true,
    });

    const res = await request(app)
      .post("/auth/firebase-sync")
      .set("Authorization", "Bearer valid-firebase-token");

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      email: "google@example.com",
      name: "Google User",
    });
    expect(res.headers["set-cookie"]?.join(";")).toMatch(/refreshToken=/);
  });

  test("firebase sync with invalid token → 401", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("invalid"));

    const res = await request(app)
      .post("/auth/firebase-sync")
      .set("Authorization", "Bearer bad-firebase-token");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid Firebase token");
  });

  test("role-based routes work with new JWT", async () => {
    const adminUser = createUserDoc({
      _id: "admin-1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      authProvider: "local",
      passwordHash: "hash",
    });

    const customerUser = createUserDoc({
      _id: "customer-1",
      email: "customer@example.com",
      name: "Customer",
      role: "customer",
      authProvider: "local",
      passwordHash: "hash",
    });

    const adminToken = jwt.sign(
      {
        sub: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        provider: adminUser.authProvider,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    const customerToken = jwt.sign(
      {
        sub: customerUser._id,
        email: customerUser.email,
        role: customerUser.role,
        provider: customerUser.authProvider,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    const adminRes = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken}`);

    const customerRes = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(adminRes.status).toBe(200);
    expect(customerRes.status).toBe(403);
    expect(customerRes.body.message).toBe("Admin only Actions!");
  });
});
