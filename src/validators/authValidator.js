const { body } = require("express-validator");

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isString()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .optional()
    .isIn(["viewer", "analyst"])
    .withMessage("Role must be one of viewer or analyst"),
];

const loginValidation = [
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const refreshValidation = [
  body("refreshToken").isString().notEmpty().withMessage("Refresh token is required"),
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshValidation,
};
