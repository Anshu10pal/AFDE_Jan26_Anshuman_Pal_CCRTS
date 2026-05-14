import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const PRIORITY_STYLES = {
  'Critical': { bg: '#450a0a', color: '#fca5a5' },
  'High':     { bg: '#fee2e2', color: '#991b1b' },
  'Medium':   { bg: '#fef3c7', color: '#92400e' },
  'Low':      { bg: '#d1fae5', color: '#065f46' },
};

function Badge({ label }) {
  const s = PRIORITY_STYLES[label] || { bg: '#f3f4f6', color: '#6b7280' };
  return <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'500', background: s.bg, color: s.color }}>{label}</span>;
}

export default function SLAHealthBoard() {
  const [health,   setHealth]   = useState(null);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/api/dashboard/sla-health').then(r => setHealth(r.data));
  }, []);

  if (!health) return null;

  const buckets = [
    { key: 'critical', ...health.critical },
    { key: 'warning',  ...health.warning  },
    { key: 'moderate', ...health.moderate },
    { key: 'good',     ...health.good     },
    { key: 'safe',     ...health.safe     },
  ];

  return (
    <>
      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: '#1e3a5f' }}>🕐 SLA Health Monitor</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {buckets.map(b => (
            <div key={b.key}
              onClick={() => b.count > 0 && setSelected(b)}
              style={{
                background: b.bg, border: `1.5px solid ${b.color}`,
                borderRadius: '10px', padding: '14px 10px',
                textAlign: 'center',
                cursor: b.count > 0 ? 'pointer' : 'default',
                opacity: b.count === 0 ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (b.count > 0) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: b.color }}>{b.count}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: '500', color: b.color, marginTop: '2px' }}>{b.label}</div>
              {b.count > 0 && (
                <div style={{ fontSize: '0.65rem', color: b.color, marginTop: '4px', opacity: 0.8 }}>
                  click to view
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Visual bar */}
        <div style={{ display: 'flex', height: '6px', borderRadius: '4px', overflow: 'hidden', marginTop: '12px', gap: '2px' }}>
          {buckets.map(b => {
            const total = buckets.reduce((s, x) => s + x.count, 0);
            const pct   = total > 0 ? (b.count / total) * 100 : 0;
            return pct > 0 ? (
              <div key={b.key} style={{ width: `${pct}%`, background: b.color, borderRadius: '2px' }} />
            ) : null;
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }}
          onClick={() => setSelected(null)}>
          <div style={{ background:'white', borderRadius:'12px', width:'100%', maxWidth:'700px', maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center', background: selected.bg }}>
              <div>
                <h2 style={{ margin:0, color: selected.color, fontSize:'1.1rem' }}>
                  {selected.label} — {selected.count} Complaint{selected.count !== 1 ? 's' : ''}
                </h2>
                <p style={{ margin:'2px 0 0', fontSize:'0.8rem', color: selected.color }}>
                  SLA usage in this range
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color: selected.color }}>×</button>
            </div>
            <div style={{ overflowY:'auto', flex:1 }}>
              <table className="table">
                <thead>
                  <tr><th>Complaint No.</th><th>Title</th><th>Priority</th><th>Status</th><th>Age</th><th>SLA %</th><th></th></tr>
                </thead>
                <tbody>
                  {selected.items.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontFamily:'monospace', fontSize:'0.75rem' }}>{c.complaint_number}</td>
                      <td style={{ maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.875rem' }}>{c.title}</td>
                      <td><Badge label={c.priority} /></td>
                      <td style={{ fontSize:'0.8rem' }}>{c.status}</td>
                      <td style={{ fontSize:'0.8rem', color:'#6b7280' }}>{c.age_hours}h</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          <div style={{ width:'60px', background:'#f3f4f6', borderRadius:'4px', height:'6px', overflow:'hidden' }}>
                            <div style={{ width:`${Math.min(c.pct_used, 100)}%`, height:'100%', background: selected.color }} />
                          </div>
                          <span style={{ fontSize:'0.75rem', color: selected.color, fontWeight:'500' }}>{c.pct_used}%</span>
                        </div>
                      </td>
                      <td>
                        <button className="btn btn-primary" style={{ padding:'0.2rem 0.6rem', fontSize:'0.75rem' }}
                          onClick={() => { setSelected(null); navigate(`/complaints/${c.id}`); }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'0.875rem 1.5rem', borderTop:'1px solid #e5e7eb', textAlign:'right' }}>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}