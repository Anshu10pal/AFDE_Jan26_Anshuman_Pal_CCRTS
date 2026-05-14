import { useEffect, useState } from 'react';
import API from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LineChart, Line
} from 'recharts';

export default function FeedbackDashboard() {
  const [data,    setData]    = useState(null);
  const [agents,  setAgents]  = useState([]);
  const [filters, setFilters] = useState({ rating: '', period: '', agent_id: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/api/users')
      .then(r => setAgents(r.data.filter(u => u.role === 'agent')))
      .catch(() => {});
    load({ rating: '', period: '', agent_id: '' });
  }, []);

  const load = async (f) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.rating)   params.append('rating',   f.rating);
    if (f.period)   params.append('period',   f.period);
    if (f.agent_id) params.append('agent_id', f.agent_id);
    try {
      const { data: res } = await API.get(`/api/feedback/filtered?${params}`);
      setData(res);
    } catch (err) {
      console.error('Feedback load error:', err);
      setData({ feedbacks: [], total: 0, average_rating: 0 });
    } finally { setLoading(false); }
  };

  const applyFilter = (key, val) => {
    const f = { ...filters, [key]: val };
    setFilters(f);
    load(f);
  };

  const resetFilters = () => {
    const f = { rating: '', period: '', agent_id: '' };
    setFilters(f);
    load(f);
  };

  // Rating breakdown bar chart data
  const ratingData = [5, 4, 3, 2, 1].map(s => ({
    star:  `${s}★`,
    count: data?.feedbacks?.filter(f => f.rating === s).length || 0
  }));

  // Agent performance from feedback
  const agentFeedback = data?.feedbacks?.reduce((acc, f) => {
    const key = f.agent_name || 'Unassigned';
    if (!acc[key]) acc[key] = { name: key, total: 0, sum: 0 };
    acc[key].total++;
    acc[key].sum += f.rating;
    return acc;
  }, {});
  const agentData = Object.values(agentFeedback || {})
    .map(a => ({ name: a.name.split(' ')[0], avg: round1(a.sum / a.total), total: a.total }))
    .sort((a, b) => b.avg - a.avg);

  function round1(n) { return Math.round(n * 10) / 10; }

  const inputStyle = {
    padding: '0.5rem 0.75rem', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '0.875rem', background: 'white'
  };

  const positiveCount  = data?.feedbacks?.filter(f => f.rating >= 4).length || 0;
  const negativeCount  = data?.feedbacks?.filter(f => f.rating <= 2).length || 0;
  const neutralCount   = data?.feedbacks?.filter(f => f.rating === 3).length || 0;

  return (
    <div>
      <div className="page-header"><h1>⭐ Customer Feedback Dashboard</h1></div>

      {/* Filters */}
      <div className="card" style={{ padding: '0.875rem 1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>Star Rating</span>
            <select style={inputStyle} value={filters.rating}
              onChange={e => applyFilter('rating', e.target.value)}>
              <option value="">All Stars</option>
              {[5, 4, 3, 2, 1].map(s => (
                <option key={s} value={s}>{'★'.repeat(s)} ({s} star{s > 1 ? 's' : ''})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>Period</span>
            <select style={inputStyle} value={filters.period}
              onChange={e => applyFilter('period', e.target.value)}>
              <option value="">All Time</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>Agent</span>
            <select style={inputStyle} value={filters.agent_id}
              onChange={e => applyFilter('agent_id', e.target.value)}>
              <option value="">All Agents</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <button className="btn btn-secondary" onClick={resetFilters}>Reset</button>

          {data && (
            <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#6b7280' }}>
              {data.total} review{data.total !== 1 ? 's' : ''} ·
              Avg: <strong style={{ color: '#f59e0b' }}>{data.average_rating}★</strong>
            </span>
          )}
        </div>
      </div>

      {/* Summary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#f59e0b', fontSize: '1.75rem' }}>
            {data?.average_rating || '—'}★
          </div>
          <div className="stat-label">Average Rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#3b82f6' }}>{data?.total || 0}</div>
          <div className="stat-label">Total Reviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#10b981' }}>{positiveCount}</div>
          <div className="stat-label">Positive (4–5★)</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#f59e0b' }}>{neutralCount}</div>
          <div className="stat-label">Neutral (3★)</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#ef4444' }}>{negativeCount}</div>
          <div className="stat-label">Negative (1–2★)</div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

        {/* Rating breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#1e3a5f', fontSize: '0.95rem' }}>
            Rating Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="star" type="category" tick={{ fontSize: 12 }} width={35} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Agent avg rating */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#1e3a5f', fontSize: '0.95rem' }}>
            Agent Avg Rating
          </h3>
          {agentData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={agentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}★`, 'Avg Rating']} />
                <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Star rating visual summary */}
      {data && data.total > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Big rating */}
            <div style={{ textAlign: 'center', minWidth: '120px' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: '700', color: '#f59e0b', lineHeight: 1 }}>
                {data.average_rating}
              </div>
              <div style={{ fontSize: '1.5rem', color: '#f59e0b', margin: '4px 0' }}>
                {'★'.repeat(Math.round(data.average_rating))}
                {'☆'.repeat(5 - Math.round(data.average_rating))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                out of 5 · {data.total} review{data.total !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Breakdown bars */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              {[5, 4, 3, 2, 1].map(star => {
                const count = data.feedbacks.filter(f => f.rating === star).length;
                const pct   = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
                const color = star >= 4 ? '#10b981' : star === 3 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', minWidth: '25px', textAlign: 'right' }}>
                      {star}★
                    </span>
                    <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', minWidth: '45px' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Satisfaction score */}
            <div style={{ textAlign: 'center', minWidth: '100px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto',
                background: `conic-gradient(#10b981 ${(positiveCount / data.total) * 360}deg, #f3f4f6 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative'
              }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: 'white', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexDirection: 'column'
                }}>
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: '#10b981' }}>
                    {data.total > 0 ? Math.round((positiveCount / data.total) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '6px' }}>Satisfaction</div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#1e3a5f', fontSize: '0.95rem' }}>All Feedback</h3>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            {data?.total || 0} record{data?.total !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
        ) : !data || data.feedbacks.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📭</p>
            <p>No feedback found for selected filters</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Complaint</th>
                <th>Agent</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.feedbacks.map(f => (
                <tr key={f.id}>
                  <td>
                    <p style={{ fontSize: '0.8rem', fontWeight: '500', margin: 0, fontFamily: 'monospace' }}>
                      {f.complaint_number}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0 0', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.complaint_title}
                    </p>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{f.agent_name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: '-1px' }}>
                        {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                      </span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: '500', padding: '1px 6px',
                        borderRadius: '10px',
                        background: f.rating >= 4 ? '#d1fae5' : f.rating === 3 ? '#fef3c7' : '#fee2e2',
                        color:      f.rating >= 4 ? '#065f46' : f.rating === 3 ? '#92400e' : '#991b1b',
                      }}>{f.rating}/5</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#6b7280', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.comments || <span style={{ color: '#d1d5db' }}>No comment</span>}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {new Date(f.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}