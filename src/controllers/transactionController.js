const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

const normalizeScope = (scopeValue) => {
  if (scopeValue === "my" || scopeValue === "own") {
    return "my";
  }

  return "all";
};

const createTransaction = asyncHandler(async (req, res) => {
  const parsedAmount = Number(req.body.amount);
  const parsedDate = req.body.date ? new Date(req.body.date) : new Date();
  const hasInvalidDate = Number.isNaN(parsedDate.getTime());
  const hasInvalidType = req.body.type !== "income" && req.body.type !== "expense";
  const hasInvalidCategory = typeof req.body.category !== "string" || !req.body.category.trim();

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || hasInvalidType || hasInvalidCategory || hasInvalidDate) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const transactionPayload = {
    amount: parsedAmount,
    type: req.body.type,
    category: req.body.category.trim(),
    date: parsedDate,
    notes: req.body.notes,
    user: req.user.id,
  };

  const transaction = await Transaction.create({
    ...transactionPayload,
  });

  return successResponse(res, "Transaction created", { transaction }, 201);
});

const getTransactionById = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    isDeleted: false,
  };

  const transaction = await Transaction.findOne(filter);

  if (!transaction) {
    return errorResponse(res, "Transaction not found", 404);
  }

  return successResponse(res, "Transaction fetched", { transaction });
});

const getTransactions = asyncHandler(async (req, res) => {
  const {
    type,
    category,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    search,
    scope = "all",
  } = req.query;

  const normalizedScope = normalizeScope(scope);

  const filter = {
    isDeleted: false,
  };

  if (normalizedScope === "my") {
    filter.user = new mongoose.Types.ObjectId(req.user.id);
  }

  if (type) {
    filter.type = type;
  }

  if (category) {
    filter.category = category;
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.date.$lte = new Date(endDate);
    }
  }

  if (search) {
    filter.$or = [{ category: { $regex: search, $options: "i" } }, { notes: { $regex: search, $options: "i" } }];
  }

  const pageNumber = parsePositiveInteger(page, 1);
  const limitNumber = Math.min(parsePositiveInteger(limit, 10), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(limitNumber),
    Transaction.countDocuments(filter),
  ]);

  return successResponse(res, "Transactions fetched", {
    transactions,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      pages: Math.ceil(total / limitNumber) || 1,
    },
    scope: normalizedScope,
  });
});

const updateTransaction = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    isDeleted: false,
  };

  if (req.user.role !== "admin") {
    filter.user = new mongoose.Types.ObjectId(req.user.id);
  }

  const transaction = await Transaction.findOne(filter);

  if (!transaction) {
    return errorResponse(res, "Transaction not found", 404);
  }

  const allowedFields = ["amount", "type", "category", "date", "notes"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      transaction[field] = req.body[field];
    }
  });

  await transaction.save();

  return successResponse(res, "Transaction updated", { transaction });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    isDeleted: false,
  };

  if (req.user.role !== "admin") {
    filter.user = new mongoose.Types.ObjectId(req.user.id);
  }

  const transaction = await Transaction.findOne(filter);

  if (!transaction) {
    return errorResponse(res, "Transaction not found", 404);
  }

  transaction.isDeleted = true;
  await transaction.save();

  return successResponse(res, "Transaction deleted");
});

module.exports = {
  createTransaction,
  getTransactionById,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};
