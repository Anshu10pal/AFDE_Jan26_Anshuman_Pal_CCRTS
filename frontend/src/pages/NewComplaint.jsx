import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../services/api';

export default function NewComplaint() {
  const [form, setForm] = useState({ title: '', description: '', category_id: '', priority: 'Medium' });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successPopup, setSuccessPopup] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { API.get('/api/categories').then(r => setCategories(r.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/api/complaints', {
        ...form,
        category_id: parseInt(form.category_id)
      });
      setSuccessPopup(data);
      setForm({ title: '', description: '', category_id: '', priority: 'Medium' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit complaint');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header"><h1>➕ New Complaint</h1></div>

      {/* Success Popup */}
      {successPopup && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '420px', width: '100%', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
            <h2 style={{ color: '#1e3a5f', marginBottom: '0.5rem' }}>Complaint Submitted!</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Your complaint has been registered successfully.
            </p>
            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem'
            }}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
                Your Complaint Number
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1d4ed8', letterSpacing: '1px' }}>
                {successPopup.complaint_number}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                Please save this for future reference
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ background: '#f9fafb', borderRadius: '6px', padding: '0.5rem' }}>
                <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '0 0 2px' }}>Priority</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>{successPopup.priority}</p>
              </div>
              <div style={{ background: '#f9fafb', borderRadius: '6px', padding: '0.5rem' }}>
                <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '0 0 2px' }}>Status</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>{successPopup.status}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={() => navigate(`/complaints/${successPopup.id}`)}>
                View Complaint
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }}
                onClick={() => { setSuccessPopup(null); }}>
                New Complaint
              </button>
            </div>
            <button
              style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.875rem' }}
              onClick={() => navigate('/complaints')}>
              Go to All Complaints →
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input type="text" placeholder="Brief title of your complaint"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category_id}
              onChange={e => setForm({ ...form, category_id: e.target.value })} required>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={5} placeholder="Describe your complaint in detail..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
            <button className="btn btn-secondary" type="button"
              onClick={() => navigate('/complaints')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}