const { body, param, query } = require("express-validator");

const createSupportTicketValidation = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 1000 })
    .withMessage("Message must not exceed 1000 characters"),
];

const updateSupportTicketValidation = [
  param("id").isMongoId().withMessage("Invalid support ticket id"),
  body("status").equals("resolved").withMessage("Only status=resolved is allowed"),
];

const supportQueryValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(["open", "resolved"])
    .withMessage("Status must be open or resolved"),
];

module.exports = {
  createSupportTicketValidation,
  updateSupportTicketValidation,
  supportQueryValidation,
};
