import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Search, Trash2, Edit, Download, Upload, Eye } from 'lucide-react';
import Papa from 'papaparse';
import './Students.css';

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [formData, setFormData] = useState({
    roll_number: '', name: '', email: '', department: '', semester: '', section: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/students/stats/attendance');
      setStudents(res.data);
    } catch (error) {
      console.error('Error fetching students', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ roll_number: '', name: '', email: '', department: '', semester: '', section: '' });
    setShowModal(true);
  };

  const openEditModal = async (student) => {
    setModalMode('edit');
    setCurrentStudentId(student.student_id);
    try {
      const res = await axios.get(`/api/students/${student.student_id}`);
      const data = res.data;
      setFormData({
        roll_number: data.roll_number || '',
        name: data.name || '',
        email: data.email || '',
        department: data.department || '',
        semester: data.semester || '',
        section: data.section || ''
      });
      setShowModal(true);
    } catch (err) {
      console.error('Error fetching student details', err);
      alert('Failed to load student details');
    }
  };

  const exportToCSV = () => {
    if (students.length === 0) return;
    const headers = ['Roll No', 'Name', 'Total Classes', 'Attended', 'Attendance %'];
    const csvRows = [
      headers.join(','),
      ...students.map(s => [
        s.roll_number,
        `"${s.name}"`,
        s.total_classes,
        s.attended,
        s.attendance_pct
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'students_attendance.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (modalMode === 'add') {
        await axios.post('/api/students', formData);
      } else {
        await axios.put(`/api/students/${currentStudentId}`, formData);
      }
      setShowModal(false);
      setFormData({ roll_number: '', name: '', email: '', department: '', semester: '', section: '' });
      fetchStudents();
    } catch (error) {
      console.error('Error saving student', error);
      alert(error.response?.data?.message || 'Failed to save student');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await axios.delete(`/api/students/${studentId}`);
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student', error);
      alert(error.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const studentsData = results.data.map(row => ({
          roll_number: row.roll_number || row['Roll Number'] || row.RollNo || '',
          name: row.name || row['Name'] || row.FullName || '',
          email: row.email || row['Email'] || '',
          department: row.department || row['Department'] || '',
          semester: row.semester || row['Semester'] || null,
          section: row.section || row['Section'] || ''
        }));
        
        try {
          setLoading(true);
          const res = await axios.post('/api/students/bulk', { students: studentsData });
          alert(`Success! ${res.data.inserted} students added.`);
          fetchStudents();
        } catch (error) {
          console.error('Bulk upload error', error);
          alert(error.response?.data?.message || 'Failed to bulk upload students.');
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        alert('Error parsing CSV file');
        console.error(error);
      }
    });
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="students-container">
      <header className="page-header flex-between">
        <div>
          <h1>Students</h1>
          <p>Manage student records and view their attendance.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} />
            <span>Bulk Upload</span>
          </button>
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <UserPlus size={18} />
            <span>Add Student</span>
          </button>
        </div>
      </header>

      <div className="glass-panel table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name or roll number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><span className="spinner"></span></div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Name</th>
                  <th>Total Classes</th>
                  <th>Attended</th>
                  <th>Attendance %</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                  <tr key={student.student_id}>
                    <td className="font-medium">{student.roll_number}</td>
                    <td>{student.name}</td>
                    <td>{student.total_classes}</td>
                    <td>{student.attended}</td>
                    <td>
                      <span className={`badge ${student.attendance_pct >= 75 ? 'badge-present' : (student.attendance_pct >= 60 ? 'badge-late' : 'badge-absent')}`}>
                        {student.attendance_pct}%
                      </span>
                    </td>
                    <td>
                      <button 
                        className="action-btn" 
                        onClick={() => navigate(`/students/${student.student_id}`)}
                        title="View Profile"
                        style={{ marginRight: '0.5rem', color: 'var(--text-secondary)' }}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="action-btn edit-btn" 
                        onClick={() => openEditModal(student)}
                        title="Edit Student"
                        style={{ marginRight: '0.5rem' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => handleDeleteStudent(student.student_id)}
                        title="Delete Student"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center empty-state">No students found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{modalMode === 'add' ? 'Add New Student' : 'Edit Student'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Roll Number *</label>
                  <input type="text" name="roll_number" className="input-field" value={formData.roll_number} onChange={handleInputChange} required />
                </div>
                <div className="input-group">
                  <label>Full Name *</label>
                  <input type="text" name="name" className="input-field" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input type="email" name="email" className="input-field" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="input-group">
                  <label>Department</label>
                  <input type="text" name="department" className="input-field" value={formData.department} onChange={handleInputChange} />
                </div>
                <div className="input-group">
                  <label>Semester</label>
                  <input type="number" name="semester" className="input-field" value={formData.semester} onChange={handleInputChange} min="1" max="10" />
                </div>
                <div className="input-group">
                  <label>Section</label>
                  <input type="text" name="section" className="input-field" value={formData.section} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'Saving...' : (modalMode === 'add' ? 'Save Student' : 'Update Student')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
