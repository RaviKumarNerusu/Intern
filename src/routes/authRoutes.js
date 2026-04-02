const express = require("express");
const {
	register,
	login,
	refreshAccessToken,
	logout,
} = require("../controllers/authController");
const {
	registerValidation,
	loginValidation,
	refreshValidation,
} = require("../validators/authValidator");
const validateRequest = require("../middleware/validateRequest");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [viewer, analyst]
 *     responses:
 *       201:
 *         description: User created
 */

router.post("/register", registerValidation, validateRequest, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login success
 */
router.post("/login", loginValidation, validateRequest, login);
router.post("/refresh", refreshValidation, validateRequest, refreshAccessToken);
router.post("/logout", protect, logout);

module.exports = router;
