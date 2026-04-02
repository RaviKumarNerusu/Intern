const request = require("supertest");
const app = require("../src/app");
const Transaction = require("../src/models/Transaction");
const { registerAndLogin } = require("./helpers");

describe("Transactions API", () => {
  test("admin can create, update, read by id, and soft delete a transaction", async () => {
    const { token } = await registerAndLogin({
      name: "Admin CRUD",
      role: "admin",
    });

    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 1500,
        type: "income",
        category: "Salary",
        notes: "April salary",
      });

    expect(createRes.status).toBe(201);
    const transactionId = createRes.body.data.transaction._id;

    const readRes = await request(app)
      .get(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.data.transaction.category).toBe("Salary");

    const updateRes = await request(app)
      .put(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 1600,
        notes: "Adjusted salary",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.transaction.amount).toBe(1600);

    const deleteRes = await request(app)
      .delete(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    const postDeleteRead = await request(app)
      .get(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(postDeleteRead.status).toBe(404);
  });

  test("viewer can read all transactions and optionally filter to own", async () => {
    const { token: adminToken } = await registerAndLogin({
      name: "Admin Tx Seed",
      role: "admin",
    });

    const viewerOne = await registerAndLogin({
      name: "Viewer One",
      role: "viewer",
    });

    const viewerTwo = await registerAndLogin({
      name: "Viewer Two",
      role: "viewer",
    });

    await Transaction.create({
      amount: 100,
      type: "income",
      category: "Gift",
      user: viewerOne.user.id,
    });

    await Transaction.create({
      amount: 90,
      type: "expense",
      category: "Food",
      user: viewerTwo.user.id,
    });

    const oneList = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${viewerOne.token}`);

    expect(oneList.status).toBe(200);
    expect(oneList.body.data.scope).toBe("all");
    expect(oneList.body.data.transactions.length).toBe(2);

    const twoList = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${viewerTwo.token}`);

    expect(twoList.status).toBe(200);
    expect(twoList.body.data.scope).toBe("all");
    expect(twoList.body.data.transactions.length).toBe(2);

    const myOnly = await request(app)
      .get("/api/transactions?scope=my")
      .set("Authorization", `Bearer ${viewerOne.token}`);

    expect(myOnly.status).toBe(200);
    expect(myOnly.body.data.scope).toBe("my");
    expect(myOnly.body.data.transactions.length).toBe(1);
    expect(myOnly.body.data.transactions[0].category).toBe("Gift");

    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${viewerOne.token}`)
      .send({
        amount: 10,
        type: "expense",
        category: "Coffee",
      });

    expect(createRes.status).toBe(403);

    const adminList = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(adminList.status).toBe(200);
    expect(adminList.body.data.transactions.length).toBe(2);
  });

  test("supports filters and pagination", async () => {
    const { token } = await registerAndLogin({
      name: "Admin Filter",
      role: "admin",
    });

    await Transaction.insertMany([
      {
        amount: 100,
        type: "income",
        category: "Salary",
        date: new Date("2026-01-15"),
        user: "000000000000000000000001",
      },
      {
        amount: 30,
        type: "expense",
        category: "Food",
        date: new Date("2026-02-15"),
        user: "000000000000000000000001",
      },
      {
        amount: 20,
        type: "expense",
        category: "Food",
        date: new Date("2026-03-01"),
        user: "000000000000000000000001",
      },
    ]);

    const filtered = await request(app)
      .get("/api/transactions?type=expense&category=Food&startDate=2026-02-01&endDate=2026-03-31&page=1&limit=1")
      .set("Authorization", `Bearer ${token}`);

    expect(filtered.status).toBe(200);
    expect(filtered.body.data.transactions.length).toBe(1);
    expect(filtered.body.data.pagination.total).toBe(2);
    expect(filtered.body.data.pagination.pages).toBe(2);
  });

  test("analyst sees all transactions by default and can filter to own", async () => {
    const analyst = await registerAndLogin({
      name: "Analyst Scope",
      role: "analyst",
    });

    const admin = await registerAndLogin({
      name: "Admin Scope Seed",
      role: "admin",
    });

    await Transaction.create({
      amount: 250,
      type: "income",
      category: "Freelance",
      user: admin.user.id,
    });

    const defaultView = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${analyst.token}`);

    expect(defaultView.status).toBe(200);
    expect(defaultView.body.data.scope).toBe("all");
    expect(defaultView.body.data.transactions.length).toBe(1);

    const myOnlyView = await request(app)
      .get("/api/transactions?scope=my")
      .set("Authorization", `Bearer ${analyst.token}`);

    expect(myOnlyView.status).toBe(200);
    expect(myOnlyView.body.data.scope).toBe("my");
    expect(myOnlyView.body.data.transactions.length).toBe(0);
  });
});
