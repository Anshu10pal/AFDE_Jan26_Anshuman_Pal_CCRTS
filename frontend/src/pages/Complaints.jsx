import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

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
  return <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '500', background: s.bg, color: s.color }}>{label}</span>;
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
    <div style={{ width: size, height: size, borderRadius: '50%', background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: '500', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function relativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return 'Just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString();
}

export default function Complaints() {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filters, setFilters]   = useState({ status: '', priority: '', search: '' });
  const [page, setPage]         = useState(1);
  const [perPage, setPerPage]   = useState(25);
  const { user } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.status)   params.append('status',   filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search)   params.append('search',   filters.search);
    API.get(`/api/complaints?${params}`).then(r => {
      setAllComplaints(r.data);
      setPage(1);
    });
  }, [filters]);

  useEffect(() => { load(); }, []);

  const totalPages = Math.ceil(allComplaints.length / perPage);
  const paginated  = allComplaints.slice((page - 1) * perPage, page * perPage);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint?')) return;
    try {
      await API.delete(`/api/complaints/${id}`);
      toast.success('Deleted successfully');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const handlePerPageChange = (val) => {
    setPerPage(val);
    setPage(1);
  };

  return (
    <div>
      <div className="page-header">
        <h1>📋 Complaints</h1>
        <button className="btn btn-primary" onClick={() => navigate('/complaints/new')}>+ New Complaint</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '0.875rem 1rem', marginBottom: '1rem', alignItems: 'center' }}>
        <input
          style={{ flex: 1, minWidth: '200px', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
          placeholder="🔍 Search complaints..."
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && load()}
        />
        <select style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
          value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option>Open</option><option>Assigned</option><option>In Progress</option>
          <option>Pending Customer Response</option><option>Escalated</option>
          <option>Resolved</option><option>Closed</option>
        </select>
        <select style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
          value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priority</option>
          <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
        </select>
        <button className="btn btn-primary" onClick={load}>Search</button>
        <button className="btn btn-secondary" onClick={() => { setFilters({ status: '', priority: '', search: '' }); setTimeout(load, 0); }}>Reset</button>
      </div>

      {/* Complaint Rows */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {paginated.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>No complaints found</div>
        ) : (
          paginated.map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px',
              borderBottom: i < paginated.length - 1 ? '1px solid #f3f4f6' : 'none',
              transition: 'background 0.15s',
              cursor: 'pointer'
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
              onClick={() => navigate(`/complaints/${c.id}`)}
            >
              <Avatar name={c.customer?.name || '?'} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0 0' }}>
                  {c.complaint_number} · {c.category?.name || '—'} · {c.customer?.name || '—'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                <Badge label={c.priority} styles={PRIORITY_STYLES} />
                <Badge label={c.status}   styles={STATUS_STYLES} />
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', minWidth: '65px', textAlign: 'right' }}>
                  {relativeTime(c.created_at)}
                </span>
                {['admin', 'supervisor'].includes(user?.role) && (
                  <button className="btn btn-danger"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', marginLeft: '4px' }}
                    onClick={e => { e.stopPropagation(); handleDelete(c.id); }}>
                    Del
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {allComplaints.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'white', borderRadius: '10px',
          border: '1px solid #e5e7eb', marginTop: '1rem', flexWrap: 'wrap', gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Show</span>
            {[25, 50, 75, 100].map(n => (
              <button key={n}
                style={{
                  padding: '4px 12px', border: '1px solid', borderRadius: '6px',
                  fontSize: '0.8rem', cursor: 'pointer', fontWeight: perPage === n ? '500' : '400',
                  borderColor: perPage === n ? '#3b82f6' : '#d1d5db',
                  background: perPage === n ? '#eff6ff' : 'white',
                  color: perPage === n ? '#1d4ed8' : '#374151'
                }}
                onClick={() => handlePerPageChange(n)}>{n}</button>
            ))}
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>per page</span>
          </div>

          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            Showing {Math.min((page - 1) * perPage + 1, allComplaints.length)}–{Math.min(page * perPage, allComplaints.length)} of {allComplaints.length}
          </span>

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              style={{ padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', fontSize: '0.8rem', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === '...'
                ? <span key={`e${i}`} style={{ padding: '4px 6px', fontSize: '0.8rem', color: '#9ca3af' }}>…</span>
                : <button key={p}
                    style={{ padding: '4px 10px', border: '1px solid', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: page === p ? '500' : '400', borderColor: page === p ? '#3b82f6' : '#d1d5db', background: page === p ? '#eff6ff' : 'white', color: page === p ? '#1d4ed8' : '#374151' }}
                    onClick={() => setPage(p)}>{p}</button>
              )}
            <button
              style={{ padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', fontSize: '0.8rem', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}