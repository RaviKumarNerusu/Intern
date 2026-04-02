const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { errorResponse } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, "Not authorized, token missing", 401);
  }

  const token = authHeader.split(" ")[1];

  if (!token || token.split(".").length !== 3) {
    return errorResponse(res, "Not authorized, invalid token", 401);
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (!decoded?.id) {
      return errorResponse(res, "Not authorized, invalid token payload", 401);
    }

    const user = await User.findById(decoded.id);

    if (!user || user.status !== "active") {
      return errorResponse(res, "Not authorized, inactive or missing user", 401);
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      status: user.status,
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return errorResponse(res, "Not authorized, token expired", 401);
    }

    if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
      return errorResponse(res, "Not authorized, invalid token", 401);
    }

    return errorResponse(res, "Not authorized, invalid token", 401);
  }
});

module.exports = {
  protect,
};
