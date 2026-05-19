const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authMiddleware } = require('../middleware/auth');

// Apply auth middleware to all attendance routes
router.use(authMiddleware);

// GET /api/attendance
router.get('/', attendanceController.getAttendanceBySubjectAndDate);

// POST /api/attendance
router.post('/', attendanceController.markAttendance);

// GET /api/attendance/trend
router.get('/trend', attendanceController.getAttendanceTrend);

// GET /api/attendance/subject-wise
router.get('/subject-wise', attendanceController.getSubjectWiseAttendance);

// GET /api/attendance/subjects
router.get('/subjects', attendanceController.getAllSubjects);

module.exports = router;
