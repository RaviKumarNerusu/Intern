const request = require("supertest");
const app = require("../src/app");
const { registerAndLogin } = require("./helpers");

describe("Users API", () => {
  test("admin can list users and update non-admin roles", async () => {
    const admin = await registerAndLogin({
      name: "User Admin",
      role: "admin",
    });

    await registerAndLogin({
      name: "Managed Viewer",
      email: "managed-viewer@example.com",
      role: "viewer",
    });

    const listRes = await request(app)
      .get("/api/users?page=1&limit=10")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data.users)).toBe(true);

    const targetUser = listRes.body.data.users.find((user) => user.email === "managed-viewer@example.com");
    expect(targetUser).toBeDefined();

    const updateRes = await request(app)
      .put(`/api/users/${targetUser._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ role: "analyst" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.user.role).toBe("analyst");
  });

  test("non-admin cannot access users management endpoints", async () => {
    const viewer = await registerAndLogin({
      name: "Users Viewer",
      role: "viewer",
    });

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${viewer.token}`);

    expect(res.status).toBe(403);
  });
});
