const request = require("supertest");
const app = require("../src/app");
const { registerAndLogin } = require("./helpers");

describe("Validation", () => {
  test("should reject registration with invalid email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Bad Email",
      email: "not-an-email",
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("should reject registration using the reserved admin email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Reserved Admin",
      email: process.env.ADMIN_EMAIL,
      password: "password123",
      role: "viewer",
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("should reject transaction with invalid input", async () => {
    const { token } = await registerAndLogin({
      name: "Admin User",
      role: "admin",
    });

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: -10,
        type: "invalidType",
        category: "",
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Invalid input" });
  });
});
