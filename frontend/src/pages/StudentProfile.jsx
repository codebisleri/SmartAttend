import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Mail, Phone, BookOpen, Hash, Calendar, CheckCircle, XCircle } from 'lucide-react';
import './StudentProfile.css';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/students/${id}/profile`);
        setProfile(res.data);
      } catch (error) {
        console.error('Error fetching student profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return <div className="loading-container"><span className="spinner"></span></div>;
  }

  if (!profile) {
    return <div className="students-container"><h2>Student not found</h2></div>;
  }

  return (
    <div className="profile-container">
      <header className="page-header flex-between">
        <div className="header-left">
          <button className="btn btn-icon" onClick={() => navigate('/students')} title="Back to Students">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{profile.name}</h1>
            <p>Student Profile & Analytics</p>
          </div>
        </div>
      </header>

      <div className="profile-grid">
        <div className="profile-card glass-panel">
          <h2>Personal Details</h2>
          <div className="details-list">
            <div className="detail-item">
              <Hash className="text-secondary" size={18} />
              <div>
                <div className="detail-label">Roll Number</div>
                <div className="detail-value">{profile.roll_number}</div>
              </div>
            </div>
            <div className="detail-item">
              <Mail className="text-secondary" size={18} />
              <div>
                <div className="detail-label">Email</div>
                <div className="detail-value">{profile.email || 'N/A'}</div>
              </div>
            </div>
            <div className="detail-item">
              <Phone className="text-secondary" size={18} />
              <div>
                <div className="detail-label">Phone</div>
                <div className="detail-value">{profile.phone || 'N/A'}</div>
              </div>
            </div>
            <div className="detail-item">
              <BookOpen className="text-secondary" size={18} />
              <div>
                <div className="detail-label">Department / Sem</div>
                <div className="detail-value">{profile.department || 'N/A'} {profile.semester ? `(Sem ${profile.semester})` : ''}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card glass-panel">
          <h2>Attendance Overview</h2>
          <div className="stats-circle-container">
            <div className={`stats-circle ${profile.attendance_pct >= 75 ? 'good' : (profile.attendance_pct >= 60 ? 'warning' : 'danger')}`}>
              <span className="stats-number">{profile.attendance_pct}%</span>
            </div>
          </div>
          <div className="stats-summary">
            <div className="stat-box">
              <div className="stat-value">{profile.total_classes}</div>
              <div className="stat-label">Total Classes</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{profile.attended}</div>
              <div className="stat-label">Attended</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lists-grid">
        <div className="glass-panel">
          <h2>Recent Attendance</h2>
          {profile.attendance_history.length > 0 ? (
            <ul className="history-list">
              {profile.attendance_history.slice(0, 10).map((record) => (
                <li key={record.att_id} className="history-item">
                  <div className="history-date">
                    <Calendar size={16} />
                    <span>{new Date(record.date).toLocaleDateString()}</span>
                  </div>
                  <span className={`badge badge-${record.status}`}>
                    {record.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-secondary text-center" style={{marginTop: '2rem'}}>No attendance records found.</p>
          )}
        </div>

        <div className="glass-panel">
          <h2>Leave Requests</h2>
          {profile.leave_requests.length > 0 ? (
            <ul className="history-list">
              {profile.leave_requests.map((leave) => (
                <li key={leave.leave_id} className="history-item leave-item">
                  <div>
                    <div className="history-date">
                      <Calendar size={16} />
                      <span>{new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-secondary mt-1">{leave.type} - {leave.reason || 'No reason'}</div>
                  </div>
                  <span className={`badge badge-${leave.status}`}>
                    {leave.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-secondary text-center" style={{marginTop: '2rem'}}>No leave requests found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
