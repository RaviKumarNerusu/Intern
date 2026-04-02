const mongoose = require("mongoose");

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  const maxRetries = Number(process.env.MONGO_MAX_RETRIES || 5);
  const retryDelayMs = Number(process.env.MONGO_RETRY_DELAY_MS || 3000);
  const serverSelectionTimeoutMS = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 5000);

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS });
      // eslint-disable-next-line no-console
      console.log("MongoDB connected successfully");
      return;
    } catch (error) {
      const hasRetryLeft = attempt <= maxRetries;
      // eslint-disable-next-line no-console
      console.error(
        `MongoDB connection failed (attempt ${attempt}/${maxRetries + 1}): ${error.message}`
      );

      if (!hasRetryLeft) {
        throw new Error(`Unable to connect to MongoDB after ${attempt} attempts`);
      }

      await wait(retryDelayMs);
    }
  }
};

module.exports = connectDB;
