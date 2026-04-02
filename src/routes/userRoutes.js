const express = require("express");
const { listUsers, updateUser, deleteUser } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  userQueryValidation,
  userIdValidation,
  userUpdateValidation,
} = require("../validators/userValidator");

const router = express.Router();

router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  userQueryValidation,
  validateRequest,
  listUsers
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  userIdValidation,
  userUpdateValidation,
  validateRequest,
  updateUser
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  userIdValidation,
  validateRequest,
  deleteUser
);

module.exports = router;
