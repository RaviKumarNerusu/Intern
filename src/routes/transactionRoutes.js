const express = require("express");
const {
  createTransaction,
  getTransactionById,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  transactionUpdateValidation,
  transactionQueryValidation,
  transactionIdValidation,
} = require("../validators/transactionValidator");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: List transactions with filters
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transactions fetched
 *   post:
 *     summary: Create transaction (admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Transaction created
 */

router.get(
  "/",
  protect,
  authorizeRoles("viewer", "analyst", "admin"),
  transactionQueryValidation,
  validateRequest,
  getTransactions
);
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createTransaction
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Update transaction (admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction updated
 *   delete:
 *     summary: Soft-delete transaction (admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted
 */
router.get(
  "/:id",
  protect,
  authorizeRoles("viewer", "analyst", "admin"),
  transactionIdValidation,
  validateRequest,
  getTransactionById
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  transactionIdValidation,
  transactionUpdateValidation,
  validateRequest,
  updateTransaction
);
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  transactionIdValidation,
  validateRequest,
  deleteTransaction
);

module.exports = router;
