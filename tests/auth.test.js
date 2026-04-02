const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const { ensureFixedAdmin } = require("../src/utils/adminSeed");

describe("Auth API", () => {
  test("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
      role: "viewer",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("alice@example.com");
  });

  test("should reject admin registration through the API", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Malicious Admin",
      email: "malicious-admin@example.com",
      password: "password123",
      role: "admin",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("should reject login with invalid credentials", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Bob",
      email: "bob@example.com",
      password: "password123",
      role: "viewer",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "bob@example.com",
      password: "wrongpass",
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("should issue refresh token and refresh access token", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Refresh User",
      email: "refresh@example.com",
      password: "password123",
      role: "viewer",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "refresh@example.com",
      password: "password123",
    });

    expect(loginRes.status).toBe(200);
    expect(typeof loginRes.body.data.refreshToken).toBe("string");

    const refreshRes = await request(app).post("/api/auth/refresh").send({
      refreshToken: loginRes.body.data.refreshToken,
    });

    expect(refreshRes.status).toBe(200);
    expect(typeof refreshRes.body.data.token).toBe("string");
  });

  test("logout should revoke refresh token", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Logout User",
      email: "logout-user@example.com",
      password: "password123",
      role: "viewer",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "logout-user@example.com",
      password: "password123",
    });

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${loginRes.body.data.token}`);

    expect(logoutRes.status).toBe(200);

    const refreshRes = await request(app).post("/api/auth/refresh").send({
      refreshToken: loginRes.body.data.refreshToken,
    });

    expect(refreshRes.status).toBe(401);
  });

  test("should enforce one fixed admin account", async () => {
    await ensureFixedAdmin();

    await User.collection.insertOne({
      name: "Rogue Admin",
      email: "rogue-admin@example.com",
      password: "hashed-placeholder",
      role: "admin",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await ensureFixedAdmin();

    const admins = await User.find({ role: "admin" });
    expect(admins.length).toBe(1);
    expect(admins[0].email).toBe(process.env.ADMIN_EMAIL);

    const rogue = await User.findOne({ email: "rogue-admin@example.com" });
    expect(rogue.role).toBe("viewer");
  });

  test("should block role escalation through update queries", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Escalation Attempt",
      email: "escalation@example.com",
      password: "password123",
      role: "viewer",
    });

    await expect(
      User.updateOne(
        { email: "escalation@example.com" },
        {
          $set: {
            role: "admin",
          },
        }
      )
    ).rejects.toThrow("Admin role is restricted");
  });
});
