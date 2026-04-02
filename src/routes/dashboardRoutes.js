const express = require("express");
const { getDashboardData } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Dashboard analytics (analyst/admin)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data fetched
 */

router.get("/", protect, authorizeRoles("analyst", "admin"), getDashboardData);

module.exports = router;
