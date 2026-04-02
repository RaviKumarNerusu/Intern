const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const supportRoutes = require("./routes/supportRoutes");
const userRoutes = require("./routes/userRoutes");
const apiRateLimiter = require("./middleware/rateLimiter");
const sanitizeInputs = require("./middleware/sanitizeMiddleware");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const swaggerSpec = require("./config/swagger");

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ALLOWED_ORIGINS || "").split(",").map((origin) => origin.trim()),
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(sanitizeInputs);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/api", apiRateLimiter);

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Service healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/users", userRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

if (process.env.SERVE_FRONTEND === "true") {
  const frontendBuildPath = path.resolve(__dirname, "../frontend/build");

  app.use(express.static(frontendBuildPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/health" || req.path.startsWith("/api-docs")) {
      next();
      return;
    }

    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
