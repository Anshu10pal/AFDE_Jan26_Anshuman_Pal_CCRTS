import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import API from '../services/api';

const STATUS_STYLES = {
  'Open':                      { bg: '#dbeafe', color: '#1d4ed8' },
  'In Progress':               { bg: '#fef3c7', color: '#92400e' },
  'Resolved':                  { bg: '#d1fae5', color: '#065f46' },
  'Closed':                    { bg: '#f3f4f6', color: '#6b7280' },
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
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
      fontSize: '0.75rem', fontWeight: '500', background: s.bg, color: s.color
    }}>{label}</span>
  );
}

function Avatar({ name, size = 32 }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';
  const colors = [
    { bg: '#dbeafe', color: '#1d4ed8' }, { bg: '#d1fae5', color: '#065f46' },
    { bg: '#fef3c7', color: '#92400e' }, { bg: '#ede9fe', color: '#5b21b6' },
    { bg: '#fee2e2', color: '#991b1b' },
  ];
  const c = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: c.bg, color: c.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: '500', flexShrink: 0
    }}>{initials}</div>
  );
}

export default function Dashboard() {
  const [stats, setStats]           = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [trend, setTrend]           = useState([]);
  const [sla, setSla]               = useState(null);
  const [modal, setModal]           = useState(null);
  const [modalComplaints, setModalComplaints] = useState([]);
  const [modalLoading, setModalLoading]       = useState(false);
  const [slaModal, setSlaModal]     = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/api/dashboard/stats').then(r => setStats(r.data));
    API.get('/api/complaints').then(r => setComplaints(r.data));
    API.get('/api/dashboard/agent-leaderboard').then(r => setLeaderboard(r.data));
    API.get('/api/dashboard/monthly-trend').then(r => setTrend(r.data));
    API.get('/api/dashboard/sla-breaches').then(r => setSla(r.data));
  }, []);

  const openModal = async (title, status) => {
    setModal({ title, status });
    setModalLoading(true);
    try {
      const { data } = await API.get(`/api/complaints?status=${encodeURIComponent(status)}`);
      setModalComplaints(data);
    } catch { setModalComplaints([]); }
    finally { setModalLoading(false); }
  };

  const closeModal = () => { setModal(null); setModalComplaints([]); };

  const categoryCount = complaints.reduce((acc, c) => {
    const cat = c.category?.name || 'Unknown';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(categoryCount).map(([name, count]) => ({
    name: name.split(' ')[0], count
  }));

  const StatCard = ({ label, value, color, status, clickable }) => (
    <div className="stat-card"
      onClick={() => clickable && openModal(label, status)}
      style={{ cursor: clickable ? 'pointer' : 'default', transition: 'transform 0.15s, box-shadow 0.15s', position: 'relative' }}
      onMouseEnter={e => { if (clickable) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {clickable && <span style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '0.65rem', color: '#9ca3af' }}>click to view</span>}
      <div className="stat-number" style={{ color }}>{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
      <div style={{ marginTop: '8px', background: '#f3f4f6', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '4px', background: color, width: `${stats ? Math.min((value / stats.total) * 100, 100) : 0}%`, transition: 'width 0.5s' }} />
      </div>
    </div>
  );

  const maxResolved = leaderboard.length > 0 ? Math.max(...leaderboard.map(a => a.resolved)) : 1;

  return (
    <div>
      <div className="page-header"><h1>📊 Dashboard</h1></div>

      {/* SLA Breach Banner */}
      {sla && sla.count > 0 && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px',
          padding: '10px 16px', display: 'flex', alignItems: 'center',
          gap: '12px', marginBottom: '1.5rem', cursor: 'pointer'
        }} onClick={() => setSlaModal(true)}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', margin: 0, color: '#991b1b' }}>
              {sla.count} complaint{sla.count !== 1 ? 's have' : ' has'} breached SLA
            </p>
            <p style={{ fontSize: '0.75rem', color: '#b91c1c', margin: '2px 0 0' }}>
              Critical: 4hrs · High: 24hrs · Medium: 48hrs · Low: 72hrs — Click to view
            </p>
          </div>
          <span style={{ background: '#991b1b', color: '#fef2f2', padding: '3px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '500' }}>
            View {sla.count} →
          </span>
        </div>
      )}

      {/* Stat Cards */}
      {stats && (
        <div className="stats-grid">
          <StatCard label="Total"       value={stats.total}       color="#1e3a5f" clickable={false} />
          <StatCard label="Open"        value={stats.open}        color="#3b82f6" status="Open"        clickable />
          <StatCard label="In Progress" value={stats.in_progress} color="#f59e0b" status="In Progress" clickable />
          <StatCard label="Resolved"    value={stats.resolved}    color="#10b981" status="Resolved"    clickable />
          <StatCard label="Escalated"   value={stats.escalated}   color="#ef4444" status="Escalated"   clickable />
          <StatCard label="Closed"      value={stats.closed}      color="#6b7280" status="Closed"      clickable />
        </div>
      )}

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#1e3a5f' }}>Complaints by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#1e3a5f' }}>Monthly Complaint Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Leaderboard */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: '#1e3a5f' }}>Agent Performance Leaderboard</h3>
        {leaderboard.length === 0
          ? <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No agent data yet</p>
          : leaderboard.map((agent, i) => (
            <div key={agent.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '8px 0', borderBottom: i < leaderboard.length - 1 ? '1px solid #f3f4f6' : 'none'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', width: '16px', textAlign: 'center' }}>{i + 1}</span>
              <Avatar name={agent.name} size={34} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>{agent.name}</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{agent.resolved} resolved / {agent.total} assigned</p>
              </div>
              <div style={{ width: '120px', background: '#f3f4f6', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '4px', background: i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : '#ef4444', width: `${maxResolved > 0 ? (agent.resolved / maxResolved) * 100 : 0}%` }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', minWidth: '35px', textAlign: 'right' }}>{agent.rate}%</span>
            </div>
          ))
        }
      </div>

      {/* Status Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={closeModal}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '750px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: '#1e3a5f', fontSize: '1.1rem' }}>{modal.title} Complaints</h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>{modalLoading ? 'Loading...' : `${modalComplaints.length} found`}</p>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {modalLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
              ) : modalComplaints.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>No complaints found</div>
              ) : (
                <table className="table">
                  <thead><tr><th>Number</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th><th></th></tr></thead>
                  <tbody>
                    {modalComplaints.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{c.complaint_number}</td>
                        <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                        <td style={{ fontSize: '0.8rem' }}>{c.category?.name || '—'}</td>
                        <td><Badge label={c.priority} styles={PRIORITY_STYLES} /></td>
                        <td><Badge label={c.status}   styles={STATUS_STYLES} /></td>
                        <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                        <td><button className="btn btn-primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }} onClick={() => { closeModal(); navigate(`/complaints/${c.id}`); }}>View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Click outside to close</span>
              <button className="btn btn-primary" onClick={() => { closeModal(); navigate(`/complaints?status=${encodeURIComponent(modal.status)}`); }}>View All →</button>
            </div>
          </div>
        </div>
      )}

      {/* SLA Modal */}
      {slaModal && sla && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setSlaModal(false)}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '750px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fee2e2' }}>
              <div>
                <h2 style={{ margin: 0, color: '#991b1b', fontSize: '1.1rem' }}>⚠️ SLA Breached Complaints</h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#b91c1c' }}>{sla.count} complaints past their resolution deadline</p>
              </div>
              <button onClick={() => setSlaModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#991b1b' }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table className="table">
                <thead><tr><th>Number</th><th>Title</th><th>Priority</th><th>Status</th><th>Age</th><th>SLA Limit</th><th></th></tr></thead>
                <tbody>
                  {sla.breaches.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{c.complaint_number}</td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                      <td><Badge label={c.priority} styles={PRIORITY_STYLES} /></td>
                      <td><Badge label={c.status}   styles={STATUS_STYLES} /></td>
                      <td style={{ color: '#ef4444', fontWeight: '500', fontSize: '0.8rem' }}>{c.age_hours}h</td>
                      <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{c.sla_hours}h</td>
                      <td><button className="btn btn-danger" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }} onClick={() => { setSlaModal(false); navigate(`/complaints/${c.id}`); }}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setSlaModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}