const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const Transaction = require("../src/models/Transaction");
const { registerAndLogin } = require("./helpers");

describe("Edge Cases", () => {
  test("should return empty transactions list", async () => {
    const { token } = await registerAndLogin({
      name: "Viewer Empty",
      role: "viewer",
    });

    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.transactions)).toBe(true);
    expect(res.body.data.transactions.length).toBe(0);
  });

  test("should support large amounts safely", async () => {
    const { token } = await registerAndLogin({
      name: "Admin Large",
      role: "admin",
    });

    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 999999999,
        type: "income",
        category: "Investment",
        notes: "Large one-time gain",
      });

    expect(createRes.status).toBe(201);

    const dashboardRes = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(dashboardRes.status).toBe(200);
    expect(dashboardRes.body.data.summary.totalIncome).toBe(999999999);
  });

  test("should reject invalid login email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      password: "password123",
    });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test("should reject expired token", async () => {
    const expiredToken = jwt.sign(
      { id: "000000000000000000000001" },
      process.env.JWT_SECRET,
      { expiresIn: -10 }
    );

    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("should handle out-of-range pagination", async () => {
    const { token } = await registerAndLogin({
      name: "Viewer Pagination",
      role: "viewer",
    });

    const res = await request(app)
      .get("/api/transactions?page=99&limit=10")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toEqual([]);
    expect(res.body.data.pagination.page).toBe(99);
  });

  test("should paginate large datasets correctly", async () => {
    const admin = await registerAndLogin({
      name: "Admin Large Pagination",
      role: "admin",
    });

    const rows = [];
    for (let i = 0; i < 150; i += 1) {
      rows.push({
        amount: 10 + i,
        type: i % 2 === 0 ? "income" : "expense",
        category: `Category-${i % 5}`,
        date: new Date("2026-04-01"),
        user: admin.user.id,
      });
    }

    await Transaction.insertMany(rows);

    const pageTwo = await request(app)
      .get("/api/transactions?page=2&limit=50")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(pageTwo.status).toBe(200);
    expect(pageTwo.body.data.transactions.length).toBe(50);
    expect(pageTwo.body.data.pagination.total).toBe(150);
    expect(pageTwo.body.data.pagination.pages).toBe(3);
    expect(pageTwo.body.data.pagination.page).toBe(2);
  });
});
