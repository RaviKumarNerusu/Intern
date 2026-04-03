const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const { registerAndLogin } = require("./helpers");
const Transaction = require("../src/models/Transaction");

describe("RBAC", () => {
  test("should block unauthorized access without token", async () => {
    const res = await request(app).get("/api/transactions");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("should block viewer from accessing dashboard analytics", async () => {
    const { token } = await registerAndLogin({
      name: "Viewer User",
      role: "viewer",
    });

    const res = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("should allow analyst to access dashboard analytics", async () => {
    const { token } = await registerAndLogin({
      name: "Analyst Dashboard User",
      role: "analyst",
    });

    const res = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("should block analyst from creating transaction", async () => {
    const { token } = await registerAndLogin({
      name: "Analyst User",
      role: "analyst",
    });

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 500,
        type: "income",
        category: "Salary",
        notes: "Monthly salary",
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("should return 401 for malformed or invalid token", async () => {
    const malformed = await request(app)
      .get("/api/transactions")
      .set("Authorization", "Bearer not-a-valid-token");

    expect(malformed.status).toBe(401);
    expect(malformed.body.success).toBe(false);

    const invalidSignatureToken = jwt.sign(
      { id: "000000000000000000000001" },
      "wrong_secret",
      { expiresIn: "1h" }
    );

    const invalidSignature = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${invalidSignatureToken}`);

    expect(invalidSignature.status).toBe(401);
    expect(invalidSignature.body.success).toBe(false);
  });

  test("should allow viewer to create tickets but block viewing all tickets", async () => {
    const viewer = await registerAndLogin({
      name: "Viewer Support",
      role: "viewer",
    });

    const createRes = await request(app)
      .post("/api/support")
      .set("Authorization", `Bearer ${viewer.token}`)
      .send({ message: "I need help with my report" });

    expect(createRes.status).toBe(201);

    const listAllRes = await request(app)
      .get("/api/support")
      .set("Authorization", `Bearer ${viewer.token}`);

    expect(listAllRes.status).toBe(403);
    expect(listAllRes.body.success).toBe(false);
  });

  test("viewer and analyst cannot delete transactions", async () => {
    const admin = await registerAndLogin({
      name: "RBAC Admin",
      role: "admin",
    });

    const viewer = await registerAndLogin({
      name: "RBAC Viewer Delete",
      role: "viewer",
    });

    const analyst = await registerAndLogin({
      name: "RBAC Analyst Delete",
      role: "analyst",
    });

    const tx = await Transaction.create({
      amount: 300,
      type: "expense",
      category: "Utilities",
      user: admin.user.id,
    });

    const viewerDelete = await request(app)
      .delete(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${viewer.token}`);

    expect(viewerDelete.status).toBe(403);

    const analystDelete = await request(app)
      .delete(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${analyst.token}`);

    expect(analystDelete.status).toBe(403);

    const adminDelete = await request(app)
      .delete(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(adminDelete.status).toBe(200);
  });
});
