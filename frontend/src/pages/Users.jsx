import { useEffect, useState } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';

export default function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    API.get('/api/users').then(r => setUsers(r.data)).catch(() => toast.error('Failed to load users'));
  }, []);

  const updateRole = async (id, role) => {
    try {
      await API.put(`/api/users/${id}/role?role=${role}`);
      toast.success('Role updated!');
      API.get('/api/users').then(r => setUsers(r.data));
    } catch { toast.error('Failed to update role'); }
  };

  return (
    <div>
      <div className="page-header"><h1>👥 User Management</h1></div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Change Role</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className="badge badge-assigned">{u.role}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <select defaultValue={u.role} onChange={e => updateRole(u.id, e.target.value)}
                    style={{ padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.8rem' }}>
                    <option value="customer">Customer</option>
                    <option value="agent">Agent</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
