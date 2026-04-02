const mongoose = require("mongoose");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { getAdminEmail } = require("../config/admin");

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, role } = req.query;

  const pageNumber = parsePositiveInteger(page, 1);
  const limitNumber = Math.min(parsePositiveInteger(limit, 10), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (role) {
    filter.role = role;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email role status createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),
    User.countDocuments(filter),
  ]);

  return successResponse(res, "Users fetched", {
    users,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      pages: Math.max(1, Math.ceil(total / limitNumber)),
    },
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, role, status } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return errorResponse(res, "User not found", 404);
  }

  const adminEmail = getAdminEmail();
  const isFixedAdmin = user.email === adminEmail;

  if (isFixedAdmin && (role || status === "inactive")) {
    return errorResponse(res, "Fixed admin cannot be downgraded or deactivated", 403);
  }

  if (name !== undefined) {
    user.name = name;
  }

  if (role !== undefined) {
    user.role = role;
  }

  if (status !== undefined) {
    user.status = status;
  }

  await user.save();

  return successResponse(res, "User updated", {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return errorResponse(res, "User not found", 404);
  }

  const adminEmail = getAdminEmail();
  if (user.email === adminEmail) {
    return errorResponse(res, "Fixed admin cannot be deleted", 403);
  }

  await User.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

  return successResponse(res, "User deleted");
});

module.exports = {
  listUsers,
  updateUser,
  deleteUser,
};
