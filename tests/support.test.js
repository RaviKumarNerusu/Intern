const request = require("supertest");
const app = require("../src/app");
const { registerAndLogin } = require("./helpers");
const SupportTicket = require("../src/models/SupportTicket");

describe("Support API", () => {
  test("viewer can view only own tickets", async () => {
    const viewerOne = await registerAndLogin({
      name: "Support User One",
      role: "viewer",
    });

    const viewerTwo = await registerAndLogin({
      name: "Support User Two",
      role: "viewer",
    });

    await SupportTicket.create({
      user: viewerOne.user.id,
      message: "Need help syncing transactions",
      status: "open",
    });

    await SupportTicket.create({
      user: viewerTwo.user.id,
      message: "My dashboard appears empty",
      status: "open",
    });

    const myTickets = await request(app)
      .get("/api/support/my")
      .set("Authorization", `Bearer ${viewerOne.token}`);

    expect(myTickets.status).toBe(200);
    expect(myTickets.body.data.tickets.length).toBe(1);
    expect(myTickets.body.data.tickets[0].message).toContain("syncing");
  });

  test("admin can list and resolve support tickets", async () => {
    const admin = await registerAndLogin({
      name: "Support Admin",
      role: "admin",
    });

    const viewer = await registerAndLogin({
      name: "Support Viewer",
      role: "viewer",
    });

    const ticket = await SupportTicket.create({
      user: viewer.user.id,
      message: "I need support with report export",
      status: "open",
    });

    const allTicketsRes = await request(app)
      .get("/api/support")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(allTicketsRes.status).toBe(200);
    expect(allTicketsRes.body.data.tickets.length).toBe(1);

    const resolveRes = await request(app)
      .put(`/api/support/${ticket._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ status: "resolved" });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.ticket.status).toBe("resolved");
  });

  test("should reject invalid support inputs and unauthorized support access", async () => {
    const noTokenRes = await request(app).post("/api/support").send({ message: "help" });
    expect(noTokenRes.status).toBe(401);

    const viewer = await registerAndLogin({
      name: "Support Input Viewer",
      role: "viewer",
    });

    const invalidMessage = await request(app)
      .post("/api/support")
      .set("Authorization", `Bearer ${viewer.token}`)
      .send({ message: "   " });

    expect(invalidMessage.status).toBe(403);

    const admin = await registerAndLogin({
      name: "Support Input Admin",
      role: "admin",
    });

    const adminInvalidCreate = await request(app)
      .post("/api/support")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ message: "   " });

    expect(adminInvalidCreate.status).toBe(400);

    const invalidResolve = await request(app)
      .put("/api/support/000000000000000000000001")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ status: "open" });

    expect(invalidResolve.status).toBe(400);
  });
});
