const pool = require('../config/db');

// Get all leave requests with student details
const getAllLeaveRequests = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, s.name as student_name, s.roll_number 
      FROM leave_requests l
      JOIN students s ON l.student_id = s.student_id
      ORDER BY l.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching leave requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update leave request status (approve/reject)
const updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE leave_requests SET status = ? WHERE leave_id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const [updated] = await pool.query(
      'SELECT l.*, s.name as student_name FROM leave_requests l JOIN students s ON l.student_id = s.student_id WHERE leave_id = ?',
      [id]
    );
    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating leave request:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllLeaveRequests, updateLeaveStatus };
