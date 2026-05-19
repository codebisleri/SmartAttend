import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Users, CalendarCheck, LogOut, FileText } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <h2>SmartAttend</h2>
        <span className="user-role badge">{user?.role}</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        {user?.role === 'admin' && (
          <>
            <NavLink to="/students" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Users size={20} />
              <span>Students</span>
            </NavLink>
            <NavLink to="/leaves" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <FileText size={20} />
              <span>Leave Requests</span>
            </NavLink>
          </>
        )}
        
        <NavLink to="/attendance" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <CalendarCheck size={20} />
          <span>Attendance</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <p className="user-name">{user?.name}</p>
          <p className="user-email">{user?.email}</p>
        </div>
        <button onClick={logout} className="btn-logout">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
