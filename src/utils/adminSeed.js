const User = require("../models/User");
const { getAdminEmail, getAdminName, getAdminPassword } = require("../config/admin");

const ensureFixedAdmin = async () => {
  const ADMIN_EMAIL = getAdminEmail();
  const ADMIN_NAME = getAdminName();
  const ADMIN_PASSWORD = getAdminPassword();

  if (!ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD is not defined");
  }

  await User.updateMany(
    {
      role: "admin",
      email: { $ne: ADMIN_EMAIL },
    },
    {
      $set: {
        role: "viewer",
      },
    }
  );

  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

  if (existingAdmin) {
    let needsSave = false;

    if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      needsSave = true;
    }

    if (existingAdmin.status !== "active") {
      existingAdmin.status = "active";
      needsSave = true;
    }

    if (existingAdmin.name !== ADMIN_NAME) {
      existingAdmin.name = ADMIN_NAME;
      needsSave = true;
    }

    if (needsSave) {
      existingAdmin.$locals = existingAdmin.$locals || {};
      existingAdmin.$locals.allowFixedAdminCreation = true;
      await existingAdmin.save();
    }

    return existingAdmin;
  }

  const admin = new User({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
    status: "active",
  });

  admin.$locals = admin.$locals || {};
  admin.$locals.allowFixedAdminCreation = true;

  await admin.save();

  return admin;
};

module.exports = {
  ensureFixedAdmin,
};