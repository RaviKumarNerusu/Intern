const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { getAdminEmail } = require("../config/admin");

const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

const generateRefreshToken = (id, tokenVersion) => {
  return jwt.sign({ id, tokenVersion, tokenType: "refresh" }, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

const shouldIssueRefreshToken = () => process.env.ENABLE_REFRESH_TOKENS !== "false";

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, status } = req.body;
  const normalizedEmail = email.toLowerCase();
  const ADMIN_EMAIL = getAdminEmail();

  if (normalizedEmail === ADMIN_EMAIL) {
    return errorResponse(res, "This email is reserved for the system admin", 403);
  }

  if (role === "admin") {
    return errorResponse(res, "Admin accounts cannot be created through the API", 403);
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return errorResponse(res, "User already exists", 409);
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: role === "analyst" ? "analyst" : "viewer",
    status: status || "active",
  });

  return successResponse(
    res,
    "User registered successfully",
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    },
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) {
    return errorResponse(res, "User not found", 404);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return errorResponse(res, "Invalid credentials", 401);
  }

  if (user.status !== "active") {
    return errorResponse(res, "User is inactive", 403);
  }

  const token = generateAccessToken(user._id);
  const includeRefreshToken = shouldIssueRefreshToken();
  const refreshToken = includeRefreshToken ? generateRefreshToken(user._id, user.tokenVersion || 0) : null;

  return successResponse(res, "Login successful", {
    token,
    ...(includeRefreshToken ? { refreshToken } : {}),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return errorResponse(res, "Refresh token is required", 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, getRefreshSecret(), {
      algorithms: ["HS256"],
    });

    if (!decoded?.id || decoded?.tokenType !== "refresh") {
      return errorResponse(res, "Invalid refresh token", 401);
    }

    const user = await User.findById(decoded.id);

    if (!user || user.status !== "active") {
      return errorResponse(res, "Invalid refresh token", 401);
    }

    if ((user.tokenVersion || 0) !== decoded.tokenVersion) {
      return errorResponse(res, "Refresh token revoked", 401);
    }

    const token = generateAccessToken(user._id);
    const nextRefreshToken = shouldIssueRefreshToken()
      ? generateRefreshToken(user._id, user.tokenVersion || 0)
      : undefined;

    return successResponse(res, "Token refreshed", {
      token,
      ...(nextRefreshToken ? { refreshToken: nextRefreshToken } : {}),
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return errorResponse(res, "Refresh token expired", 401);
    }

    return errorResponse(res, "Invalid refresh token", 401);
  }
});

const logout = asyncHandler(async (req, res) => {
  await User.updateOne(
    { _id: req.user.id },
    {
      $inc: {
        tokenVersion: 1,
      },
    }
  );

  return successResponse(res, "Logged out successfully");
});

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
};
