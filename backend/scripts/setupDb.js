const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  console.log('Connecting to MySQL...');
  
  // Create connection without database to create the DB first
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  const dbName = process.env.DB_NAME || 'smartattend';

  try {
    console.log(`Creating database ${dbName} if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    await connection.query(`USE ${dbName}`);

    console.log('Creating tables...');

    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'teacher') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Students table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        student_id INT AUTO_INCREMENT PRIMARY KEY,
        roll_number VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        department VARCHAR(50),
        semester INT,
        section VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Subjects table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        subject_id INT AUTO_INCREMENT PRIMARY KEY,
        subject_code VARCHAR(20) NOT NULL UNIQUE,
        subject_name VARCHAR(100) NOT NULL,
        teacher_id INT,
        FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE SET NULL
      )
    `);

    // Attendance table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        att_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('present', 'absent', 'late') NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
        UNIQUE KEY unique_attendance (student_id, subject_id, date)
      )
    `);

    // Leave Requests table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        leave_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        type VARCHAR(50) NOT NULL,
        reason TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
      )
    `);

    // Risk Scores table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS risk_scores (
        score_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        risk_score INT NOT NULL,
        factors TEXT,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
      )
    `);

    console.log('Inserting dummy users (admin and teacher)...');
    
    // Check if users exist
    const [users] = await connection.query('SELECT * FROM users');
    if (users.length === 0) {
      const passwordHash = await bcrypt.hash('password123', 10);
      await connection.query(`
        INSERT INTO users (name, email, password_hash, role) VALUES 
        ('Admin User', 'admin@smartattend.com', ?, 'admin'),
        ('Teacher User', 'teacher@smartattend.com', ?, 'teacher')
      `, [passwordHash, passwordHash]);
      console.log('Dummy users inserted.');
    } else {
       console.log('Users already exist, skipping dummy users.');
    }
    
    console.log('Inserting dummy students...');
    const [students] = await connection.query('SELECT * FROM students');
    if (students.length === 0) {
       await connection.query(`
          INSERT INTO students (roll_number, name, email, phone, department, semester, section) VALUES 
          ('CS001', 'Arjun Sharma', 'arjun@student.com', '1234567890', 'Computer Science', 6, 'A'),
          ('CS002', 'Priya Patel', 'priya@student.com', '1234567891', 'Computer Science', 6, 'A'),
          ('CS003', 'Rohit Kumar', 'rohit@student.com', '1234567892', 'Computer Science', 6, 'A'),
          ('CS004', 'Sneha Reddy', 'sneha@student.com', '1234567893', 'Computer Science', 6, 'A'),
          ('CS005', 'Anjali Mishra', 'anjali@student.com', '1234567894', 'Computer Science', 6, 'B'),
          ('CS006', 'Vikram Singh', 'vikram@student.com', '1234567895', 'Computer Science', 6, 'B'),
          ('CS007', 'Teju', 'teju@student.com', '1234567896', 'Computer Science', 6, 'B')
       `);
       console.log('Dummy students inserted.');
    } else {
       console.log('Students already exist, skipping dummy students.');
    }

    console.log('Inserting dummy subjects...');
    const [subjects] = await connection.query('SELECT * FROM subjects');
    if(subjects.length === 0) {
      await connection.query(`
          INSERT INTO subjects (subject_code, subject_name, teacher_id) VALUES 
          ('CS301', 'Database Management Systems', 2),
          ('CS302', 'Operating Systems', 2),
          ('CS303', 'Computer Networks', 2)
      `);
      console.log('Dummy subjects inserted.');
    } else {
      console.log('Subjects already exist, skipping dummy subjects.');
    }
    
    // Add some initial leave requests
    const [leaves] = await connection.query('SELECT * FROM leave_requests');
    if(leaves.length === 0) {
      await connection.query(`
        INSERT INTO leave_requests (student_id, start_date, end_date, type, reason, status) VALUES 
        (1, '2024-05-10', '2024-05-12', 'Medical', 'Fever', 'approved'),
        (3, '2024-05-18', '2024-05-20', 'Personal', 'Family function', 'pending'),
        (4, '2024-05-25', '2024-05-25', 'Sick Leave', 'Headache', 'pending'),
        (6, '2024-05-01', '2024-05-05', 'Medical', 'Surgery', 'approved')
      `);
      console.log('Dummy leaves inserted.');
    } else {
      console.log('Leaves already exist, skipping.');
    }

    // Add some random attendance for the last 15 days for a subject
    console.log('Generating dummy attendance data...');
    const [attendance] = await connection.query('SELECT * FROM attendance');
    if(attendance.length === 0) {
       const today = new Date();
       const statuses = ['present', 'present', 'present', 'present', 'absent', 'late']; // Weighted towards present
       
       for(let i=15; i>0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          
          for(let studentId = 1; studentId <= 7; studentId++) {
             // For Rohit (3) make him absent often
             let s = statuses[Math.floor(Math.random() * statuses.length)];
             if (studentId === 3 && Math.random() > 0.5) s = 'absent';
             
             await connection.query(`
                INSERT IGNORE INTO attendance (student_id, subject_id, date, status) 
                VALUES (?, 1, ?, ?)
             `, [studentId, dateStr, s]);
          }
       }
       console.log('Dummy attendance inserted.');
    }

    console.log('Database setup completed successfully!');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await connection.end();
  }
}

setupDatabase();
