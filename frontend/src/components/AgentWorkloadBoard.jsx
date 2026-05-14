import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const PRIORITY_STYLES = {
  'Critical': { bg: '#450a0a', color: '#fca5a5' },
  'High':     { bg: '#fee2e2', color: '#991b1b' },
  'Medium':   { bg: '#fef3c7', color: '#92400e' },
  'Low':      { bg: '#d1fae5', color: '#065f46' },
};
const STATUS_STYLES = {
  'Open':                      { bg: '#dbeafe', color: '#1d4ed8' },
  'In Progress':               { bg: '#fef3c7', color: '#92400e' },
  'Resolved':                  { bg: '#d1fae5', color: '#065f46' },
  'Closed':                    { bg: '#f3f4f6', color: '#6b7280' },
  'Escalated':                 { bg: '#fee2e2', color: '#991b1b' },
  'Assigned':                  { bg: '#ede9fe', color: '#5b21b6' },
  'Pending Customer Response': { bg: '#fef9c3', color: '#854d0e' },
};

function Badge({ label, styles }) {
  const s = styles?.[label] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '20px',
      fontSize: '0.7rem', fontWeight: '500', background: s.bg, color: s.color,
      whiteSpace: 'nowrap'
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
    { bg: '#fee2e2', color: '#991b1b' },
  ];
  const c = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: c.bg, color: c.color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: '600',
    }}>{initials}</div>
  );
}

export default function AgentWorkloadBoard({ userRole }) {
  const [data,        setData]        = useState(null);
  const [selected,    setSelected]    = useState(null); // { type: 'agent'|'unassigned', agent? }
  const [agentTickets, setAgentTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!['admin', 'supervisor'].includes(userRole)) return;
    API.get('/api/dashboard/agent-workload').then(r => setData(r.data));
  }, [userRole]);

  if (!['admin', 'supervisor'].includes(userRole)) return null;

  const openAgent = async (agent) => {
    setSelected({ type: 'agent', agent });
    setLoadingTickets(true);
    try {
      const { data: tickets } = await API.get(
        `/api/complaints?status=Open&status=Assigned&status=In Progress&status=Escalated`
      );
      // filter to this agent
      const mine = tickets.filter(t => t.agent?.id === agent.id || t.assigned_to === agent.id);
      setAgentTickets(mine);
    } catch { setAgentTickets([]); }
    finally { setLoadingTickets(false); }
  };

  const openUnassigned = () => {
    setSelected({ type: 'unassigned' });
    setAgentTickets([]);
  };

  const closeModal = () => { setSelected(null); setAgentTickets([]); };

  if (!data) return (
    <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
      Loading workload board...
    </div>
  );

  const maxTickets = Math.max(...data.agents.map(a => a.total), 1);

  return (
    <>
      <div className="card">
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1.25rem'
        }}>
          <h3 style={{ margin: 0, color: '#1e3a5f' }}>
            🧑‍💼 Agent Workload Board
          </h3>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#6b7280' }}>
            <span>🟢 Active tickets per agent</span>
            <span>🔴 SLA breached</span>
          </div>
        </div>

        {/* Agent blocks grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '12px'
        }}>
          {data.agents.map(agent => (
            <div key={agent.id}
              onClick={() => openAgent(agent)}
              style={{
                border: `1.5px solid ${agent.breached > 0 ? '#fca5a5' : '#e5e7eb'}`,
                borderRadius: '12px',
                padding: '14px',
                cursor: 'pointer',
                background: agent.breached > 0 ? '#fff5f5' : 'white',
                transition: 'all 0.15s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {/* SLA breach badge */}
              {agent.breached > 0 && (
                <div style={{
                  position: 'absolute', top: '-8px', right: '-8px',
                  background: '#ef4444', color: 'white',
                  borderRadius: '50%', width: '20px', height: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: '700'
                }}>{agent.breached}</div>
              )}

              {/* Avatar + name */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Avatar name={agent.name} size={44} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: '600', margin: 0, color: '#111827' }}>
                    {agent.name.split(' ')[0]}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: 0 }}>
                    {agent.name.split(' ').slice(1).join(' ')}
                  </p>
                </div>
              </div>

              {/* Ticket count */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '2rem', fontWeight: '700',
                  color: agent.total === 0 ? '#10b981' : agent.breached > 0 ? '#ef4444' : '#1e3a5f'
                }}>{agent.total}</span>
                <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>
                  active ticket{agent.total !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Progress bar */}
              <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '5px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{
                  height: '100%', borderRadius: '4px',
                  background: agent.breached > 0 ? '#ef4444' : '#3b82f6',
                  width: `${(agent.total / maxTickets) * 100}%`,
                  transition: 'width 0.5s'
                }} />
              </div>

              {/* Priority mini badges */}
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {agent.by_priority.Critical > 0 && (
                  <span style={{ fontSize: '0.65rem', background: '#450a0a', color: '#fca5a5', padding: '1px 5px', borderRadius: '10px' }}>
                    {agent.by_priority.Critical}C
                  </span>
                )}
                {agent.by_priority.High > 0 && (
                  <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#991b1b', padding: '1px 5px', borderRadius: '10px' }}>
                    {agent.by_priority.High}H
                  </span>
                )}
                {agent.by_priority.Medium > 0 && (
                  <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '10px' }}>
                    {agent.by_priority.Medium}M
                  </span>
                )}
                {agent.by_priority.Low > 0 && (
                  <span style={{ fontSize: '0.65rem', background: '#d1fae5', color: '#065f46', padding: '1px 5px', borderRadius: '10px' }}>
                    {agent.by_priority.Low}L
                  </span>
                )}
                {agent.total === 0 && (
                  <span style={{ fontSize: '0.65rem', color: '#10b981' }}>✓ free</span>
                )}
              </div>
            </div>
          ))}

          {/* Unassigned block */}
          <div
            onClick={openUnassigned}
            style={{
              border: `1.5px solid ${data.unassigned_count > 0 ? '#fbbf24' : '#e5e7eb'}`,
              borderRadius: '12px',
              padding: '14px',
              cursor: 'pointer',
              background: data.unassigned_count > 0 ? '#fffbeb' : 'white',
              transition: 'all 0.15s',
              position: 'relative',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            {data.unassigned_count > 0 && (
              <div style={{
                position: 'absolute', top: '-8px', right: '-8px',
                background: '#f59e0b', color: 'white',
                borderRadius: '50%', width: '20px', height: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: '700'
              }}>{data.unassigned_count}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: '#fef3c7', color: '#92400e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem'
              }}>📋</div>
              <p style={{ fontSize: '0.8rem', fontWeight: '600', margin: 0, color: '#111827', textAlign: 'center' }}>
                Unassigned
              </p>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <span style={{
                fontSize: '2rem', fontWeight: '700',
                color: data.unassigned_count > 0 ? '#f59e0b' : '#10b981'
              }}>{data.unassigned_count}</span>
              <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>
                ticket{data.unassigned_count !== 1 ? 's' : ''} pending
              </p>
            </div>

            <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '5px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{
                height: '100%', borderRadius: '4px', background: '#f59e0b',
                width: `${Math.min((data.unassigned_count / (maxTickets || 1)) * 100, 100)}%`,
              }} />
            </div>
            <p style={{ fontSize: '0.65rem', color: '#92400e', textAlign: 'center', margin: 0 }}>
              Sorted by SLA urgency
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }} onClick={closeModal}>
          <div style={{
            background: 'white', borderRadius: '12px', width: '100%',
            maxWidth: '800px', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: selected.type === 'unassigned' ? '#fffbeb' : 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {selected.type === 'agent'
                  ? <Avatar name={selected.agent.name} size={40} />
                  : <span style={{ fontSize: '1.5rem' }}>📋</span>
                }
                <div>
                  <h2 style={{ margin: 0, color: '#1e3a5f', fontSize: '1.1rem' }}>
                    {selected.type === 'agent'
                      ? `${selected.agent.name}'s Tickets`
                      : 'Unassigned Tickets'
                    }
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                    {selected.type === 'agent'
                      ? `${selected.agent.email} · ${selected.agent.total} active tickets`
                      : `${data.unassigned_count} tickets sorted by SLA urgency`
                    }
                  </p>
                </div>
              </div>
              <button onClick={closeModal} style={{
                background: 'none', border: 'none',
                fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280'
              }}>×</button>
            </div>

            {/* Priority summary for agent */}
            {selected.type === 'agent' && (
              <div style={{
                display: 'flex', gap: '1rem', padding: '0.75rem 1.5rem',
                background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
                flexWrap: 'wrap'
              }}>
                {Object.entries(selected.agent.by_priority).map(([p, count]) => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Badge label={p} styles={PRIORITY_STYLES} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{count}</span>
                  </div>
                ))}
                {selected.agent.breached > 0 && (
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: '500' }}>
                      ⚠️ {selected.agent.breached} SLA breached
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Modal body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {selected.type === 'agent' ? (
                loadingTickets ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading tickets...</div>
                ) : agentTickets.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    <p style={{ fontSize: '1.5rem' }}>🎉</p>
                    <p>No active tickets</p>
                  </div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Complaint No.</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Age</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentTickets.map(c => {
                        const slaLimits = { Critical: 4, High: 24, Medium: 48, Low: 72 };
                        const age  = Math.floor((Date.now() - new Date(c.created_at)) / 3600000);
                        const limit = slaLimits[c.priority] || 72;
                        const breached = age > limit;
                        return (
                          <tr key={c.id} style={{ background: breached ? '#fff5f5' : '' }}>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {c.complaint_number}
                            </td>
                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                              {c.title}
                            </td>
                            <td style={{ fontSize: '0.8rem' }}>{c.category?.name || '—'}</td>
                            <td><Badge label={c.priority} styles={PRIORITY_STYLES} /></td>
                            <td><Badge label={c.status}   styles={STATUS_STYLES} /></td>
                            <td style={{ fontSize: '0.8rem', color: breached ? '#ef4444' : '#6b7280', fontWeight: breached ? '500' : '400' }}>
                              {age}h {breached ? '⚠️' : ''}
                            </td>
                            <td>
                              <button className="btn btn-primary"
                                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                                onClick={() => { closeModal(); navigate(`/complaints/${c.id}`); }}>
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              ) : (
                // Unassigned tickets
                data.unassigned.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    <p style={{ fontSize: '1.5rem' }}>✅</p>
                    <p>All tickets are assigned!</p>
                  </div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Complaint No.</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Age</th>
                        <th>SLA Remaining</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.unassigned.map(c => (
                        <tr key={c.id} style={{ background: c.breached ? '#fff5f5' : '' }}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {c.complaint_number}
                          </td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                            {c.title}
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>{c.category}</td>
                          <td><Badge label={c.priority} styles={PRIORITY_STYLES} /></td>
                          <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{c.age_hours}h</td>
                          <td>
                            {c.breached ? (
                              <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: '500' }}>
                                ⚠️ Breached by {Math.abs(c.sla_remaining)}h
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: c.sla_remaining < 4 ? '#f59e0b' : '#10b981', fontWeight: '500' }}>
                                {c.sla_remaining}h left
                              </span>
                            )}
                          </td>
                          <td>
                            <button className="btn btn-warning"
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => { closeModal(); navigate(`/complaints/${c.id}`); }}>
                              Assign
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '0.875rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                Click outside to close
              </span>
              {selected.type === 'unassigned' && data.unassigned.length > 0 && (
                <button className="btn btn-primary"
                  onClick={() => { closeModal(); navigate('/complaints'); }}>
                  View All Complaints →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}