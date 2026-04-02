const dotenv = require("dotenv");
const app = require("./app");
const connectDB = require("./config/db");
const { ensureFixedAdmin } = require("./utils/adminSeed");

dotenv.config();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const startServer = async () => {
  try {
    await connectDB();
    await ensureFixedAdmin();

    // eslint-disable-next-line no-console
    console.log(`Starting API server in ${process.env.NODE_ENV || "development"} mode`);

    app.listen(PORT, HOST, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on ${HOST}:${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

process.on("unhandledRejection", (error) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  // eslint-disable-next-line no-console
  console.error("Uncaught exception:", error);
  process.exit(1);
});

startServer();
