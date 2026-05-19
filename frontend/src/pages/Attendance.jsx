import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Calendar, Download } from 'lucide-react';
import './Attendance.css';

const Attendance = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Fetch subjects on mount
    axios.get('/api/attendance/subjects')
      .then(res => {
        setSubjects(res.data);
        if (res.data.length > 0) {
          setSelectedSubject(res.data[0].subject_id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const loadAttendance = async () => {
    if (!selectedSubject || !date) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.get(`/api/attendance?subject_id=${selectedSubject}&date=${date}`);
      setStudents(res.data);
    } catch (error) {
      console.error('Error fetching attendance', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      loadAttendance();
    }
  }, [selectedSubject, date]);

  const handleStatusChange = (studentId, status) => {
    setStudents(students.map(s => 
      s.student_id === studentId ? { ...s, status } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        subject_id: selectedSubject,
        date,
        attendance: students.map(s => ({ student_id: s.student_id, status: s.status }))
      };
      await axios.post('/api/attendance', payload);
      setMessage({ type: 'success', text: 'Attendance saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save attendance.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const exportToCSV = () => {
    if (students.length === 0) return;
    const subject = subjects.find(s => s.subject_id == selectedSubject);
    const subName = subject ? subject.subject_code : 'Subject';
    const headers = ['Roll No', 'Name', 'Status'];
    const csvRows = [
      headers.join(','),
      ...students.map(s => [
        s.roll_number,
        `"${s.name}"`,
        s.status
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `attendance_${subName}_${date}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="attendance-container">
      <header className="page-header">
        <h1>Mark Attendance</h1>
        <p>Select a subject and date to record student attendance.</p>
      </header>

      <div className="glass-panel attendance-controls">
        <div className="control-group">
          <label>Subject</label>
          <select 
            className="input-field" 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {subjects.map(sub => (
              <option key={sub.subject_id} value={sub.subject_id}>
                {sub.subject_code} - {sub.subject_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Date</label>
          <div className="date-picker-wrapper">
            <Calendar size={18} className="calendar-icon" />
            <input 
              type="date" 
              className="input-field date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="control-group action-group">
          <button 
            className="btn btn-secondary" 
            onClick={exportToCSV} 
            disabled={students.length === 0}
            style={{ marginRight: '1rem' }}
          >
            <Download size={18} /> Export
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving || students.length === 0}
          >
            {saving ? <span className="spinner"></span> : <><Save size={18} /> Save Attendance</>}
          </button>
        </div>
      </div>

      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="glass-panel table-container">
        {loading ? (
          <div className="loading-container"><span className="spinner"></span></div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? students.map((student) => (
                  <tr key={student.student_id}>
                    <td className="font-medium">{student.roll_number}</td>
                    <td>{student.name}</td>
                    <td>
                      <div className="status-toggle">
                        <button 
                          className={`status-btn present ${student.status === 'present' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(student.student_id, 'present')}
                        >
                          Present
                        </button>
                        <button 
                          className={`status-btn late ${student.status === 'late' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(student.student_id, 'late')}
                        >
                          Late
                        </button>
                        <button 
                          className={`status-btn absent ${student.status === 'absent' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(student.student_id, 'absent')}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="text-center empty-state">No students found for this selection</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
