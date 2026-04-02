const { body, param, query } = require("express-validator");

const userQueryValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("search").optional().isString().isLength({ max: 100 }),
  query("status").optional().isIn(["active", "inactive"]),
  query("role").optional().isIn(["viewer", "analyst", "admin"]),
];

const userIdValidation = [param("id").isMongoId().withMessage("Invalid user id")];

const userUpdateValidation = [
  body("name").optional().isString().trim().notEmpty().isLength({ max: 100 }),
  body("status").optional().isIn(["active", "inactive"]),
  body("role").optional().isIn(["viewer", "analyst"]).withMessage("Role can only be viewer or analyst"),
];

module.exports = {
  userQueryValidation,
  userIdValidation,
  userUpdateValidation,
};
