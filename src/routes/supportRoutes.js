const express = require("express");
const {
  createSupportTicket,
  getMySupportTickets,
  getAllSupportTickets,
  resolveSupportTicket,
} = require("../controllers/supportController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  createSupportTicketValidation,
  updateSupportTicketValidation,
  supportQueryValidation,
} = require("../validators/supportValidator");

const router = express.Router();

/**
 * @swagger
 * /api/support:
 *   post:
 *     summary: Create a support ticket (admin only)
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: I need help with transaction export
 *     responses:
 *       201:
 *         description: Ticket created
 *   get:
 *     summary: List all support tickets (admin only)
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, resolved]
 *     responses:
 *       200:
 *         description: Support tickets fetched
 */

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createSupportTicketValidation,
  validateRequest,
  createSupportTicket
);

router.get(
  "/my",
  protect,
  authorizeRoles("viewer", "analyst", "admin"),
  supportQueryValidation,
  validateRequest,
  getMySupportTickets
);

/**
 * @swagger
 * /api/support/my:
 *   get:
 *     summary: List own support tickets
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, resolved]
 *     responses:
 *       200:
 *         description: Own support tickets fetched
 */

router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  supportQueryValidation,
  validateRequest,
  getAllSupportTickets
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateSupportTicketValidation,
  validateRequest,
  resolveSupportTicket
);

/**
 * @swagger
 * /api/support/{id}:
 *   put:
 *     summary: Resolve a support ticket (admin only)
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [resolved]
 *     responses:
 *       200:
 *         description: Ticket resolved
 */

module.exports = router;
