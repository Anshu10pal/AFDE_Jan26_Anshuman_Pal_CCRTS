import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../services/api';
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
const TIMELINE_COLORS = {
  'Open':                      '#3b82f6',
  'Assigned':                  '#8b5cf6',
  'In Progress':               '#f59e0b',
  'Escalated':                 '#ef4444',
  'Resolved':                  '#10b981',
  'Closed':                    '#6b7280',
  'Pending Customer Response': '#f59e0b',
};

function Badge({ label, styles }) {
  const s = styles[label] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 12px', borderRadius: '20px',
      fontSize: '0.8rem', fontWeight: '500', background: s.bg, color: s.color
    }}>{label}</span>
  );
}

function Avatar({ name, size = 40 }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';
  const colors = [
    { bg: '#dbeafe', color: '#1d4ed8' },
    { bg: '#d1fae5', color: '#065f46' },
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#ede9fe', color: '#5b21b6' },
  ];
  const c = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: c.bg, color: c.color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: '500',
    }}>{initials}</div>
  );
}

function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star}
          style={{
            fontSize: '1.5rem', cursor: readonly ? 'default' : 'pointer',
            color: star <= (hover || value) ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.1s'
          }}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
        >★</span>
      ))}
    </div>
  );
}

export default function ComplaintDetail() {
  const { id }    = useParams();
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [complaint,      setComplaint]      = useState(null);
  const [history,        setHistory]        = useState([]);
  const [agents,         setAgents]         = useState([]);
  const [feedback,       setFeedback]       = useState(null);
  const [status,         setStatus]         = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [selectedAgent,  setSelectedAgent]  = useState('');
  const [rating,         setRating]         = useState(0);
  const [comment,        setComment]        = useState('');
  const [loading,        setLoading]        = useState(false);

  const loadData = () => {
    API.get(`/api/complaints/${id}`).then(r => {
      setComplaint(r.data);
      setStatus(r.data.status);
      setSelectedAgent(r.data.assigned_to || '');
    });
    API.get(`/api/complaints/${id}/history`).then(r => setHistory(r.data));
    API.get(`/api/feedback/${id}`)
      .then(r => { if (r.data) setFeedback(r.data); })
      .catch(() => {});
    if (['admin', 'supervisor'].includes(user?.role)) {
      API.get('/api/users')
        .then(r => setAgents(r.data.filter(u => u.role === 'agent')));
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleStatusUpdate = async () => {
    setLoading(true);
    try {
      await API.put(`/api/complaints/${id}`, {
        status,
        resolution_note: resolutionNote || undefined
      });
      toast.success('Status updated!');
      setResolutionNote('');
      loadData();
    } catch { toast.error('Update failed'); }
    finally { setLoading(false); }
  };

  const handleAssign = async () => {
    if (!selectedAgent) return toast.error('Select an agent first');
    try {
      await API.patch(`/api/complaints/${id}/assign?agent_id=${selectedAgent}`);
      toast.success('Complaint assigned!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Assignment failed');
    }
  };

  const handleConfirmResolution = async () => {
    try {
      await API.put(`/api/complaints/${id}`, { status: 'Closed' });
      toast.success('Resolution confirmed! Complaint closed.');
      loadData();
    } catch { toast.error('Failed to confirm resolution'); }
  };

  const handleRejectResolution = async () => {
    try {
      await API.put(`/api/complaints/${id}`, { status: 'In Progress' });
      toast.success('Resolution rejected. Complaint reopened.');
      loadData();
    } catch { toast.error('Failed to reject resolution'); }
  };

  const handleFeedback = async () => {
    if (!rating) return toast.error('Please select a rating');
    try {
      await API.post(
        `/api/feedback/${id}?rating=${rating}&comments=${encodeURIComponent(comment)}`
      );
      toast.success('Feedback submitted!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit feedback');
    }
  };

  if (!complaint) return (
    <div style={{ padding: '2rem', color: '#6b7280' }}>Loading...</div>
  );

  const slaHours   = { Critical: 4, High: 24, Medium: 48, Low: 72 };
  const ageHours   = Math.floor((Date.now() - new Date(complaint.created_at)) / 3600000);
  const slaLimit   = slaHours[complaint.priority] || 72;
  const slaBreached = ['Open', 'Assigned', 'In Progress', 'Escalated']
    .includes(complaint.status) && ageHours > slaLimit;

  const isResolved    = complaint.status === 'Resolved';
  const isCustomer    = user?.role === 'customer';
  const isAdminOrAgent = ['admin', 'agent', 'supervisor'].includes(user?.role);
  const isOwner       = complaint.customer?.email === user?.email;

  return (
    <div>
      <div className="page-header">
        <h1>🔍 Complaint Detail</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/complaints')}>← Back</button>
      </div>

      {/* SLA Warning */}
      {slaBreached && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5',
          borderRadius: '8px', padding: '10px 16px',
          marginBottom: '1rem', display: 'flex', gap: '10px', alignItems: 'center'
        }}>
          <span>⚠️</span>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b', fontWeight: '500' }}>
            SLA Breached — This {complaint.priority} complaint is {ageHours}h old (limit: {slaLimit}h)
          </p>
        </div>
      )}

      {/* Customer confirm/reject resolution banner */}
      {isResolved && isCustomer && isOwner && !feedback && (
        <div style={{
          background: '#d1fae5', border: '1px solid #6ee7b7',
          borderRadius: '8px', padding: '12px 16px',
          marginBottom: '1rem', display: 'flex',
          alignItems: 'center', gap: '12px', flexWrap: 'wrap'
        }}>
          <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: '500', color: '#065f46' }}>
            ✅ Your complaint has been resolved. Are you satisfied with the resolution?
          </span>
          <button className="btn btn-success" onClick={handleConfirmResolution}>
            ✓ Yes, close it
          </button>
          <button className="btn btn-danger" onClick={handleRejectResolution}>
            ✗ No, reopen it
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* ── Left column — Complaint Info ── */}
        <div className="card">

          {/* Customer header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '1rem', paddingBottom: '1rem',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <Avatar name={complaint.customer?.name} size={44} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '500', margin: 0 }}>
                {complaint.customer?.name || '—'}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0 0' }}>
                {complaint.customer?.email || '—'}
              </p>
            </div>
            <Badge label={complaint.status}   styles={STATUS_STYLES} />
            <Badge label={complaint.priority} styles={PRIORITY_STYLES} />
          </div>

          {/* Title */}
          <h3 style={{ margin: '0 0 1rem', color: '#1e3a5f', fontSize: '1rem' }}>
            {complaint.title}
          </h3>

          {/* Fields grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
            {[
              ['Complaint No.', complaint.complaint_number, true],
              ['Category',      complaint.category?.name || '—'],
              ['Created',       new Date(complaint.created_at).toLocaleString()],
              ['Last Updated',  new Date(complaint.updated_at).toLocaleString()],
              ['Age',           `${ageHours}h ${slaBreached ? '⚠️' : '✓'}`],
              ['SLA Limit',     `${slaLimit}h`],
              ['Assigned To',   complaint.agent?.name || 'Unassigned'],
            ].map(([label, value, mono]) => (
              <div key={label} style={{ background: '#f9fafb', borderRadius: '6px', padding: '8px 10px' }}>
                <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '0 0 2px' }}>{label}</p>
                <p style={{
                  fontSize: '0.825rem', fontWeight: '500', margin: 0,
                  fontFamily: mono ? 'monospace' : 'inherit'
                }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div style={{ background: '#f9fafb', borderRadius: '6px', padding: '10px 12px', marginBottom: complaint.resolution_note ? '1rem' : 0 }}>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 6px' }}>Description</p>
            <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: '1.6' }}>
              {complaint.description}
            </p>
          </div>

          {/* Resolution note (if exists) */}
          {complaint.resolution_note && (
            <div style={{ background: '#d1fae5', borderRadius: '6px', padding: '10px 12px', marginTop: '1rem', border: '1px solid #6ee7b7' }}>
              <p style={{ fontSize: '0.75rem', color: '#065f46', margin: '0 0 6px', fontWeight: '500' }}>
                ✅ Resolution Notes
              </p>
              <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: '1.6' }}>
                {complaint.resolution_note}
              </p>
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div>

          {/* Assign to agent (admin/supervisor only) */}
          {['admin', 'supervisor'].includes(user?.role) && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 1rem', color: '#1e3a5f', fontSize: '0.95rem' }}>
                Assign to Agent
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedAgent}
                  onChange={e => setSelectedAgent(e.target.value)}
                  style={{
                    flex: 1, padding: '0.5rem', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '0.875rem'
                  }}
                >
                  <option value="">Select agent...</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={handleAssign}>Assign</button>
              </div>
            </div>
          )}

          {/* Self-assign button for agents */}
          {user?.role === 'agent' && !complaint.assigned_to && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', color: '#1e3a5f', fontSize: '0.95rem' }}>
                Take this ticket
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.75rem' }}>
                This complaint is unassigned. You can take ownership of it.
              </p>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={async () => {
                  try {
                    await API.patch(`/api/complaints/${id}/self-assign`);
                    toast.success('Ticket assigned to you!');
                    loadData();
                  } catch (err) {
                    toast.error(err.response?.data?.detail || 'Failed to self-assign');
                  }
                }}
              >
                🎧 Assign to me
              </button>
            </div>
          )}

          {/* Update Status */}
          {isAdminOrAgent && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 1rem', color: '#1e3a5f', fontSize: '0.95rem' }}>
                Update Status
              </h3>

              <div className="form-group">
                <label>New Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option>Open</option>
                  <option>Assigned</option>
                  <option>In Progress</option>
                  <option>Pending Customer Response</option>
                  <option>Escalated</option>
                  <option>Resolved</option>
                  <option>Closed</option>
                </select>
              </div>

              {/* Resolution notes — only shown when Resolved is selected */}
              {status === 'Resolved' && (
                <div className="form-group">
                  <label>Resolution Notes</label>
                  <textarea
                    rows={3}
                    value={resolutionNote}
                    onChange={e => setResolutionNote(e.target.value)}
                    placeholder="Describe how this complaint was resolved..."
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              )}

              <button
                className="btn btn-success"
                onClick={handleStatusUpdate}
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          )}

          {/* Feedback — customer, resolved/closed, not yet rated */}
          {isCustomer && isOwner && ['Resolved', 'Closed'].includes(complaint.status) && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 1rem', color: '#1e3a5f', fontSize: '0.95rem' }}>
                {feedback ? '⭐ Your Feedback' : 'Rate this Resolution'}
              </h3>
              {feedback ? (
                <div>
                  <StarRating value={feedback.rating} readonly />
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    {feedback.comments || 'No comments provided'}
                  </p>
                </div>
              ) : (
                <>
                  <StarRating value={rating} onChange={setRating} />
                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label>Comments (optional)</label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Share your experience..."
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleFeedback}
                    style={{ width: '100%' }}
                  >
                    Submit Feedback
                  </button>
                </>
              )}
            </div>
          )}

          {/* Timeline History */}
          <div className="card">
            <h3 style={{ margin: '0 0 1rem', color: '#1e3a5f', fontSize: '0.95rem' }}>
              Status History
            </h3>

            {[
              ...history,
              {
                id: 'created', new_status: 'Open', old_status: null,
                comment: 'Complaint created',
                updated_at: complaint.created_at, isCreated: true
              }
            ].map((h, i, arr) => (
              <div key={h.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%', marginTop: '3px',
                    background: TIMELINE_COLORS[h.new_status] || '#6b7280',
                    border: '2px solid white',
                    boxShadow: `0 0 0 2px ${TIMELINE_COLORS[h.new_status] || '#6b7280'}`
                  }} />
                  {i < arr.length - 1 && (
                    <div style={{ width: '2px', flex: 1, minHeight: '24px', background: '#e5e7eb', margin: '2px 0' }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? '12px' : 0, flex: 1 }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: '500', margin: 0, color: '#111827' }}>
                    {h.isCreated ? 'Complaint created' : (
                      <>
                        {h.old_status} → {' '}
                        <span style={{ color: TIMELINE_COLORS[h.new_status] || '#6b7280' }}>
                          {h.new_status}
                        </span>
                      </>
                    )}
                  </p>
                  {h.comment && !h.isCreated && (
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0 0' }}>
                      {h.comment}
                    </p>
                  )}
                  {h.resolution_note && (
                    <p style={{ fontSize: '0.75rem', color: '#065f46', margin: '2px 0 0', fontStyle: 'italic' }}>
                      📝 {h.resolution_note}
                    </p>
                  )}
                  <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '2px 0 0' }}>
                    {new Date(h.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                No status changes yet
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}