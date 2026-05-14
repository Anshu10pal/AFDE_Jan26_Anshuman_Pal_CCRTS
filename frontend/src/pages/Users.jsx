import { useEffect, useState } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const [users, setUsers] = useState([]);
  const { user: currentUser } = useAuth();

  const load = () => {
    API.get('/api/users')
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Failed to load users'));
  };

  useEffect(() => { load(); }, []);

  const updateRole = async (id, role) => {
    try {
      await API.put(`/api/users/${id}/role?role=${role}`);
      toast.success('Role updated!');
      load();
    } catch { toast.error('Failed to update role'); }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/api/users/${id}`);
      toast.success('User deleted!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const roleBadge = (role) => {
    const map = {
      admin:      { bg: '#450a0a', color: '#fca5a5' },
      supervisor: { bg: '#fef3c7', color: '#92400e' },
      agent:      { bg: '#dbeafe', color: '#1d4ed8' },
      customer:   { bg: '#d1fae5', color: '#065f46' },
    };
    const s = map[role] || { bg: '#f3f4f6', color: '#6b7280' };
    return (
      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '500', background: s.bg, color: s.color }}>
        {role}
      </span>
    );
  };

  const Avatar = ({ name }) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';
    const colors = [
      { bg: '#dbeafe', color: '#1d4ed8' }, { bg: '#d1fae5', color: '#065f46' },
      { bg: '#fef3c7', color: '#92400e' }, { bg: '#ede9fe', color: '#5b21b6' },
      { bg: '#fee2e2', color: '#991b1b' },
    ];
    const c = colors[name?.charCodeAt(0) % colors.length] || colors[0];
    return (
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: '500', flexShrink: 0 }}>
        {initials}
      </div>
    );
  };

  const grouped = ['admin', 'supervisor', 'agent', 'customer'].reduce((acc, role) => {
    acc[role] = users.filter(u => u.role === role);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1>👥 User Management</h1>
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{users.length} total users</span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { role: 'admin',      label: 'Admins',      color: '#991b1b' },
          { role: 'supervisor', label: 'Supervisors', color: '#92400e' },
          { role: 'agent',      label: 'Agents',      color: '#1d4ed8' },
          { role: 'customer',   label: 'Customers',   color: '#065f46' },
        ].map(({ role, label, color }) => (
          <div key={role} className="stat-card">
            <div className="stat-number" style={{ color }}>{grouped[role]?.length || 0}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Joined</th>
              <th>Change Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar name={u.name} />
                    <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{u.email}</td>
                <td>{roleBadge(u.role)}</td>
                <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td>
                  <select
                    defaultValue={u.role}
                    onChange={e => updateRole(u.id, e.target.value)}
                    style={{ padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.8rem' }}
                  >
                    <option value="customer">Customer</option>
                    <option value="agent">Agent</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  {u.id !== currentUser?.id && (
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => deleteUser(u.id, u.name)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}