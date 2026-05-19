const pool = require('../config/db');

const getAllStudents = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students ORDER BY roll_number');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE student_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createStudent = async (req, res) => {
  const { roll_number, name, email, phone, department, semester, section } = req.body;
  if (!roll_number || !name) {
    return res.status(400).json({ message: 'Roll number and name are required.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO students (roll_number, name, email, phone, department, semester, section) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [roll_number, name, email, phone, department, semester, section]
    );
    const [newStudent] = await pool.query('SELECT * FROM students WHERE student_id = ?', [result.insertId]);
    res.status(201).json(newStudent[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Roll number or email already exists.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateStudent = async (req, res) => {
  const { roll_number, name, email, phone, department, semester, section } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE students SET roll_number=?, name=?, email=?, phone=?, department=?, semester=?, section=? WHERE student_id=?',
      [roll_number, name, email, phone, department, semester, section, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Student not found' });
    const [updated] = await pool.query('SELECT * FROM students WHERE student_id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Roll number or email already exists.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM students WHERE student_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudentAttendancePercentage = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.student_id, s.name, s.roll_number,
        COUNT(a.att_id) as total_classes,
        SUM(CASE WHEN a.status = 'present' OR a.status = 'late' THEN 1 ELSE 0 END) as attended,
        ROUND(
          (SUM(CASE WHEN a.status = 'present' OR a.status = 'late' THEN 1 ELSE 0 END) / COUNT(a.att_id)) * 100, 
          1
        ) as attendance_pct
      FROM students s
      LEFT JOIN attendance a ON s.student_id = a.student_id
      GROUP BY s.student_id
      ORDER BY s.roll_number
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const bulkCreateStudents = async (req, res) => {
  const { students } = req.body;
  if (!students || !Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: 'A valid array of students is required.' });
  }

  const validStudents = students.filter(s => s.roll_number && s.name);
  if (validStudents.length === 0) {
    return res.status(400).json({ message: 'No valid student data found.' });
  }

  const values = validStudents.map(s => [
    s.roll_number,
    s.name,
    s.email || null,
    s.phone || null,
    s.department || null,
    s.semester || null,
    s.section || null
  ]);

  try {
    const [result] = await pool.query(
      'INSERT IGNORE INTO students (roll_number, name, email, phone, department, semester, section) VALUES ?',
      [values]
    );
    res.status(201).json({ 
      message: 'Bulk upload successful', 
      inserted: result.affectedRows,
      totalProcessed: validStudents.length
    });
  } catch (err) {
    console.error('Bulk upload error:', err);
    res.status(500).json({ message: 'Server error during bulk upload' });
  }
};

const getStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.id;
    const [students] = await pool.query('SELECT * FROM students WHERE student_id = ?', [studentId]);
    if (students.length === 0) return res.status(404).json({ message: 'Student not found' });
    const student = students[0];

    const [attendance] = await pool.query('SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC', [studentId]);
    const [leaves] = await pool.query('SELECT * FROM leave_requests WHERE student_id = ? ORDER BY created_at DESC', [studentId]);

    const total_classes = attendance.length;
    const attended = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendance_pct = total_classes > 0 ? ((attended / total_classes) * 100).toFixed(1) : 0;

    res.json({
      ...student,
      total_classes,
      attended,
      attendance_pct,
      attendance_history: attendance,
      leave_requests: leaves
    });
  } catch (err) {
    console.error('Error fetching student profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent, getStudentAttendancePercentage, bulkCreateStudents, getStudentProfile };
