import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BookOpen, AlertCircle, TrendingUp } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    averageAttendance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [studentsRes, subjectsRes, trendRes] = await Promise.all([
          axios.get('/api/students'),
          axios.get('/api/attendance/subjects'),
          axios.get('/api/attendance/trend')
        ]);
        
        setStats({
          totalStudents: studentsRes.data.length,
          totalSubjects: subjectsRes.data.length,
          averageAttendance: 85 // Mocked for display
        });
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-container"><span className="spinner"></span></div>;
  }

  return (
    <div className="dashboard-container">
      <header className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's what's happening today.</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-color)' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <p className="stat-label">Total Students</p>
            <h3 className="stat-value">{stats.totalStudents}</h3>
          </div>
        </div>
        
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-details">
            <p className="stat-label">Subjects</p>
            <h3 className="stat-value">{stats.totalSubjects}</h3>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-details">
            <p className="stat-label">Avg Attendance</p>
            <h3 className="stat-value">{stats.averageAttendance}%</h3>
          </div>
        </div>
        
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-details">
            <p className="stat-label">At Risk Students</p>
            <h3 className="stat-value">3</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
