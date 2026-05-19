import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import './LeaveRequests.css';

const LeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/leaves');
      setRequests(res.data);
    } catch (error) {
      console.error('Error fetching leave requests', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`/api/leaves/${id}/status`, { status });
      setRequests(requests.map(req => 
        req.leave_id === id ? { ...req, status } : req
      ));
    } catch (error) {
      console.error('Error updating status', error);
      alert('Failed to update status');
    }
  };

  return (
    <div className="leaves-container">
      <header className="page-header">
        <h1>Leave Requests</h1>
        <p>Review and manage student leave requests.</p>
      </header>

      <div className="glass-panel table-container">
        {loading ? (
          <div className="loading-container"><span className="spinner"></span></div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length > 0 ? requests.map((req) => (
                  <tr key={req.leave_id}>
                    <td>
                      <div className="font-medium">{req.student_name}</div>
                      <div className="text-sm text-secondary">{req.roll_number}</div>
                    </td>
                    <td><span className="badge badge-type">{req.type}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} className="text-secondary" />
                        <span className="text-sm">
                          {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="reason-cell">{req.reason || '-'}</td>
                    <td>
                      <span className={`badge badge-${req.status}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.status === 'pending' && (
                        <div className="action-buttons">
                          <button 
                            className="action-btn approve-btn" 
                            onClick={() => handleUpdateStatus(req.leave_id, 'approved')}
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            className="action-btn reject-btn" 
                            onClick={() => handleUpdateStatus(req.leave_id, 'rejected')}
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center empty-state">No leave requests found.</td>
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

export default LeaveRequests;
