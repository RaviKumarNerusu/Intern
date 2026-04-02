const mongoose = require("mongoose");
const SupportTicket = require("../models/SupportTicket");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const buildPagination = (page, limit, total) => {
  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  return {
    page: pageNumber,
    limit: limitNumber,
    total,
    pages: Math.max(1, Math.ceil(total / limitNumber)),
  };
};

const createSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.create({
    user: req.user.id,
    message: req.body.message,
    status: "open",
  });

  return successResponse(res, "Support ticket created", { ticket }, 201);
});

const getMySupportTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const filter = {
    user: new mongoose.Types.ObjectId(req.user.id),
  };

  if (status) {
    filter.status = status;
  }

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
    SupportTicket.countDocuments(filter),
  ]);

  return successResponse(res, "Support tickets fetched", {
    tickets,
    pagination: buildPagination(page, limit, total),
  });
});

const getAllSupportTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const filter = {};
  if (status) {
    filter.status = status;
  }

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),
    SupportTicket.countDocuments(filter),
  ]);

  return successResponse(res, "Support tickets fetched", {
    tickets,
    pagination: buildPagination(page, limit, total),
  });
});

const resolveSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
    return errorResponse(res, "Support ticket not found", 404);
  }

  ticket.status = "resolved";
  await ticket.save();

  return successResponse(res, "Support ticket resolved", { ticket });
});

module.exports = {
  createSupportTicket,
  getMySupportTickets,
  getAllSupportTickets,
  resolveSupportTicket,
};
