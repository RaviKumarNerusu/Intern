const getAdminEmail = () => (process.env.ADMIN_EMAIL || "ravinerusu1@gmail.com").toLowerCase();
const getAdminName = () => process.env.ADMIN_NAME || "System Administrator";
const getAdminPassword = () => process.env.ADMIN_PASSWORD || "";

module.exports = {
  getAdminEmail,
  getAdminName,
  getAdminPassword,
};