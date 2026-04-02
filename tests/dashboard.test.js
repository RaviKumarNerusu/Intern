const request = require("supertest");
const app = require("../src/app");
const Transaction = require("../src/models/Transaction");
const { registerAndLogin } = require("./helpers");

describe("Dashboard API", () => {
  test("analyst can view dashboard summary and trends", async () => {
    const analyst = await registerAndLogin({
      name: "Analyst Dash",
      role: "analyst",
    });

    const viewer = await registerAndLogin({
      name: "Viewer Dash Shared",
      role: "viewer",
    });

    await Transaction.insertMany([
      {
        amount: 2000,
        type: "income",
        category: "Salary",
        date: new Date("2026-01-10"),
        user: analyst.user.id,
      },
      {
        amount: 300,
        type: "expense",
        category: "Rent",
        date: new Date("2026-01-20"),
        user: analyst.user.id,
      },
      {
        amount: 200,
        type: "expense",
        category: "Food",
        date: new Date("2026-02-02"),
        user: analyst.user.id,
      },
      {
        amount: 150,
        type: "income",
        category: "Gift",
        date: new Date("2026-02-18"),
        user: viewer.user.id,
      },
    ]);

    const res = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${analyst.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalIncome).toBe(2150);
    expect(res.body.data.summary.totalExpenses).toBe(500);
    expect(res.body.data.summary.netBalance).toBe(1650);
    expect(Array.isArray(res.body.data.categoryWise)).toBe(true);
    expect(Array.isArray(res.body.data.monthlyTrends)).toBe(true);
    expect(Array.isArray(res.body.data.recentTransactions)).toBe(true);
    expect(res.body.data.recentTransactions.length).toBe(4);
  });

  test("dashboard returns only latest 5 transactions", async () => {
    const admin = await registerAndLogin({
      name: "Admin Dashboard",
      role: "admin",
    });

    const tx = [];
    for (let i = 0; i < 8; i += 1) {
      tx.push({
        amount: 10 + i,
        type: i % 2 === 0 ? "income" : "expense",
        category: `Cat-${i}`,
        date: new Date(`2026-03-${String(i + 1).padStart(2, "0")}`),
        user: admin.user.id,
      });
    }

    await Transaction.insertMany(tx);

    const res = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.recentTransactions.length).toBe(5);
  });
});
