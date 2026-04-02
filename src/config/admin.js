const requireEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not defined in environment variables`);
  }

  return value;
};

const getAdminEmail = () => requireEnv("ADMIN_EMAIL").toLowerCase();
const getAdminName = () => process.env.ADMIN_NAME || "System Administrator";
const getAdminPassword = () => requireEnv("ADMIN_PASSWORD");

module.exports = {
  getAdminEmail,
  getAdminName,
  getAdminPassword,
};