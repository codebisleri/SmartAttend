const pool = require('../config/db');

const getAttendanceBySubjectAndDate = async (req, res) => {
  const { subject_id, date } = req.query;
  if (!subject_id || !date) return res.status(400).json({ message: 'subject_id and date are required.' });
  try {
    const [rows] = await pool.query(`
      SELECT s.student_id, s.roll_number, s.name, 
        COALESCE(a.status, 'absent') as status
      FROM students s
      LEFT JOIN attendance a 
        ON s.student_id = a.student_id 
        AND a.subject_id = ? 
        AND a.date = ?
      ORDER BY s.roll_number
    `, [subject_id, date]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const markAttendance = async (req, res) => {
  const { subject_id, date, attendance } = req.body;
  if (!subject_id || !date || !attendance || !Array.isArray(attendance)) {
    return res.status(400).json({ message: 'subject_id, date and attendance array are required.' });
  }
  try {
    for (const record of attendance) {
      await pool.query(`
        INSERT INTO attendance (student_id, subject_id, date, status) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status)
      `, [record.student_id, subject_id, date, record.status]);
    }
    res.json({ message: 'Attendance marked successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAttendanceTrend = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
      FROM attendance
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY date
      ORDER BY date ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSubjectWiseAttendance = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        sub.subject_name,
        COUNT(a.att_id) as total,
        SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) as present,
        ROUND((SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) / COUNT(a.att_id))*100, 1) as pct
      FROM subjects sub
      LEFT JOIN attendance a ON sub.subject_id = a.subject_id
      GROUP BY sub.subject_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllSubjects = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subjects');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAttendanceBySubjectAndDate, markAttendance, getAttendanceTrend, getSubjectWiseAttendance, getAllSubjects };
