const request = require("supertest");
const app = require("../src/app");
const { ensureFixedAdmin } = require("../src/utils/adminSeed");
const { getAdminEmail, getAdminPassword, getAdminName } = require("../src/config/admin");

let generatedUserId = 0;

const registerAndLogin = async ({
  name = "Test User",
  email = "test@example.com",
  password = "password123",
  role = "viewer",
  status = "active",
} = {}) => {
  const userEmail = email === "test@example.com" && role !== "admin"
    ? `test-user-${++generatedUserId}@example.com`
    : email;

  if (role === "admin") {
    await ensureFixedAdmin();

    const ADMIN_EMAIL = getAdminEmail();
    const ADMIN_PASSWORD = getAdminPassword();
    const ADMIN_NAME = getAdminName();

    const loginRes = await request(app).post("/api/auth/login").send({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    return {
      token: loginRes.body.data.token,
      user: {
        ...loginRes.body.data.user,
        name: ADMIN_NAME,
      },
    };
  }

  await request(app).post("/api/auth/register").send({
    name,
    email: userEmail,
    password,
    role,
    status,
  });

  const loginRes = await request(app).post("/api/auth/login").send({ email: userEmail, password });

  return {
    token: loginRes.body.data.token,
    user: loginRes.body.data.user,
  };
};

module.exports = {
  registerAndLogin,
};
