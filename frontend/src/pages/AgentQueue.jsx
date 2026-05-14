import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLES = {
  'Open':                      { bg: '#dbeafe', color: '#1d4ed8' },
  'In Progress':               { bg: '#fef3c7', color: '#92400e' },
  'Resolved':                  { bg: '#d1fae5', color: '#065f46' },
  'Escalated':                 { bg: '#fee2e2', color: '#991b1b' },
  'Assigned':                  { bg: '#ede9fe', color: '#5b21b6' },
  'Pending Customer Response': { bg: '#fef9c3', color: '#854d0e' },
};
const PRIORITY_STYLES = {
  'Low':      { bg: '#d1fae5', color: '#065f46' },
  'Medium':   { bg: '#fef3c7', color: '#92400e' },
  'High':     { bg: '#fee2e2', color: '#991b1b' },
  'Critical': { bg: '#450a0a', color: '#fca5a5' },
};

function Badge({ label, styles }) {
  const s = styles[label] || { bg: '#f3f4f6', color: '#6b7280' };
  return <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '500', background: s.bg, color: s.color }}>{label}</span>;
}

export default function AgentQueue() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/api/complaints')
      .then(r => {
        const mine = r.data.filter(c =>
          ['Open', 'Assigned', 'In Progress', 'Escalated', 'Pending Customer Response']
            .includes(c.status)
        );
        setComplaints(mine);
      })
      .finally(() => setLoading(false));
  }, []);

  const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const sorted = [...complaints].sort((a, b) =>
    (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
  );

  const slaHours = { Critical: 4, High: 24, Medium: 48, Low: 72 };

  return (
    <div>
      <div className="page-header">
        <h1>🎧 My Work Queue</h1>
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {complaints.length} active ticket{complaints.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {['Critical', 'High', 'Medium', 'Low'].map(p => {
          const count = sorted.filter(c => c.priority === p).length;
          const colors = { Critical: '#991b1b', High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
          return (
            <div key={p} className="stat-card">
              <div className="stat-number" style={{ color: colors[p] }}>{count}</div>
              <div className="stat-label">{p} priority</div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
      ) : sorted.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎉</p>
          <p style={{ fontWeight: '500' }}>All caught up!</p>
          <p style={{ fontSize: '0.875rem' }}>No active tickets in your queue</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Complaint</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Age</th>
                <th>SLA</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => {
                const ageHours = Math.floor((Date.now() - new Date(c.created_at)) / 3600000);
                const slaLimit = slaHours[c.priority] || 72;
                const breached = ageHours > slaLimit;
                return (
                  <tr key={c.id} style={{ background: breached ? '#fff5f5' : '' }}>
                    <td>
                      <p style={{ fontWeight: '500', fontSize: '0.875rem', margin: 0 }}>{c.title}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0 0', fontFamily: 'monospace' }}>{c.complaint_number}</p>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{c.category?.name || '—'}</td>
                    <td><Badge label={c.priority} styles={PRIORITY_STYLES} /></td>
                    <td><Badge label={c.status}   styles={STATUS_STYLES} /></td>
                    <td style={{ fontSize: '0.8rem', color: breached ? '#ef4444' : '#6b7280', fontWeight: breached ? '500' : '400' }}>
                      {ageHours}h {breached ? '⚠️' : ''}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{slaLimit}h</td>
                    <td>
                      <button className="btn btn-primary"
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => navigate(`/complaints/${c.id}`)}>
                        Work
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}