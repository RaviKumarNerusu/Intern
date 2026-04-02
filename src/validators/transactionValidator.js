const { body, query, param } = require("express-validator");

const transactionValidation = [
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be greater than 0"),
  body("type").isIn(["income", "expense"]).withMessage("Type must be income or expense"),
  body("category").trim().notEmpty().withMessage("Category is required").isLength({ max: 100 }),
  body("date").optional().isISO8601().withMessage("Date must be a valid ISO8601 date"),
  body("notes").optional().isString().isLength({ max: 500 }),
];

const transactionUpdateValidation = [
  body("amount").optional().isFloat({ gt: 0 }).withMessage("Amount must be greater than 0"),
  body("type").optional().isIn(["income", "expense"]),
  body("category").optional().trim().notEmpty().isLength({ max: 100 }),
  body("date").optional().isISO8601(),
  body("notes").optional().isString().isLength({ max: 500 }),
];

const transactionQueryValidation = [
  query("type").optional().isIn(["income", "expense"]),
  query("category").optional().isString().isLength({ max: 100 }),
  query("startDate").optional().isISO8601(),
  query("endDate")
    .optional()
    .isISO8601()
    .custom((endDate, { req }) => {
      if (req.query.startDate && new Date(req.query.startDate) > new Date(endDate)) {
        throw new Error("endDate must be on or after startDate");
      }

      return true;
    }),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("search").optional().isString().isLength({ max: 100 }),
  query("scope").optional().isIn(["all", "my", "own"]),
];

const transactionIdValidation = [param("id").isMongoId().withMessage("Invalid transaction id")];

module.exports = {
  transactionValidation,
  transactionUpdateValidation,
  transactionQueryValidation,
  transactionIdValidation,
};
