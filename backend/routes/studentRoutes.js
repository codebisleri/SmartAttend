const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Apply auth middleware to all student routes
router.use(authMiddleware);

// GET /api/students/stats/attendance
router.get('/stats/attendance', studentController.getStudentAttendancePercentage);

// GET /api/students
router.get('/', studentController.getAllStudents);

// GET /api/students/:id/profile
router.get('/:id/profile', studentController.getStudentProfile);

// GET /api/students/:id
router.get('/:id', studentController.getStudentById);

// POST /api/students/bulk (Admin only)
router.post('/bulk', adminOnly, studentController.bulkCreateStudents);

// POST /api/students (Admin only)
router.post('/', adminOnly, studentController.createStudent);

// PUT /api/students/:id (Admin only)
router.put('/:id', adminOnly, studentController.updateStudent);

// DELETE /api/students/:id (Admin only)
router.delete('/:id', adminOnly, studentController.deleteStudent);

module.exports = router;
