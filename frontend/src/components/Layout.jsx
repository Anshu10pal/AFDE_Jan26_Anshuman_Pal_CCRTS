import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkStyle = ({ isActive }) => ({
    display: 'block',
    padding: '0.65rem 1.5rem',
    color: isActive ? '#3b82f6' : '#374151',
    textDecoration: 'none',
    fontSize: '0.875rem',
    transition: 'background 0.2s',
    background: isActive ? '#eff6ff' : 'transparent',
    borderRight: isActive ? '3px solid #3b82f6' : '3px solid transparent',
  });

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-brand">🎯 CCRTS — Complaint & Resolution Tracking</span>
        <div className="navbar-user">
          <span>👤 {user?.name} ({user?.role})</span>
          <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">

          {/* Common — all roles */}
          <div style={{ padding: '0.5rem 1.5rem 0.25rem', fontSize: '0.7rem', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Main
          </div>
          <NavLink to="/" end style={navLinkStyle}>🏠 Dashboard</NavLink>
          <NavLink to="/complaints" style={navLinkStyle}>📋 Complaints</NavLink>
          <NavLink to="/complaints/new" style={navLinkStyle}>➕ New Complaint</NavLink>

          {/* Agent + Admin + Supervisor */}
          {['admin', 'supervisor', 'agent'].includes(user?.role) && (
            <>
              <div style={{ padding: '0.75rem 1.5rem 0.25rem', fontSize: '0.7rem', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                Work
              </div>
              <NavLink to="/queue" style={navLinkStyle}>🎧 My Queue</NavLink>
            </>
          )}

          {/* Admin + Supervisor only */}
          {['admin', 'supervisor'].includes(user?.role) && (
            <>
              <div style={{ padding: '0.75rem 1.5rem 0.25rem', fontSize: '0.7rem', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                Analytics
              </div>
              <NavLink to="/feedback-dashboard" style={navLinkStyle}>⭐ Feedback</NavLink>
              <NavLink to="/reports" style={navLinkStyle}>📥 Reports</NavLink>
            </>
          )}

          {/* Admin only */}
          {user?.role === 'admin' && (
            <>
              <div style={{ padding: '0.75rem 1.5rem 0.25rem', fontSize: '0.7rem', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                Admin
              </div>
              <NavLink to="/users" style={navLinkStyle}>👥 Users</NavLink>
            </>
          )}

          {/* Role badge at bottom */}
          <div style={{
            position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem',
            background: '#f9fafb', borderRadius: '8px', padding: '10px 12px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '0 0 2px' }}>Logged in as</p>
            <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1e3a5f', margin: 0 }}>{user?.name}</p>
            <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '2px 0 0', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>

        </aside>

        {/* Main content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}