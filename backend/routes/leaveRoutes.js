const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/leaves
router.get('/', leaveController.getAllLeaveRequests);

// PUT /api/leaves/:id/status (Admin/Teacher only)
router.put('/:id/status', adminOnly, leaveController.updateLeaveStatus);

module.exports = router;
