import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar">
        <span className="navbar-brand">🎯 CCRTS — Complaint & Resolution Tracking</span>
        <div className="navbar-user">
          <span>👤 {user?.name} ({user?.role})</span>
          <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <div className="layout">
        <aside className="sidebar">
          <NavLink to="/" end>🏠 Dashboard</NavLink>
          <NavLink to="/complaints">📋 Complaints</NavLink>
          <NavLink to="/complaints/new">➕ New Complaint</NavLink>
          {user?.role === 'admin' && <NavLink to="/users">👥 Users</NavLink>}
        </aside>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
