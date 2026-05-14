import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import API from '../services/api';

export default function Login() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken,  setResetToken]  = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState('forgot'); // 'forgot' | 'reset'
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/api/auth/login', form);
      const meRes = await API.get('/api/users/me', {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      login(meRes.data, data.access_token);
      toast.success('Login successful!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleForgot = async () => {
    try {
      const { data } = await API.post(`/api/auth/forgot-password?email=${encodeURIComponent(forgotEmail)}`);
      setResetToken(data.reset_token || '');
      setStep('reset');
      toast.info('Reset token generated! In production this would be emailed.');
    } catch (err) {
      toast.error('Email not found');
    }
  };

  const handleReset = async () => {
    try {
      await API.post(`/api/auth/reset-password?token=${resetToken}&new_password=${encodeURIComponent(newPassword)}`);
      toast.success('Password reset successfully! Please login.');
      setShowForgot(false);
      setStep('forgot');
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Reset failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1e3a5f' }}>🎯 CCRTS Login</h2>

        {!showForgot ? (
          <>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="Enter email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="Enter password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <button className="btn btn-primary" type="submit"
                style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.875rem' }}>
              <button onClick={() => setShowForgot(true)}
                style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.875rem' }}>
                Forgot password?
              </button>
              <Link to="/register">Register</Link>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ color: '#1e3a5f', marginBottom: '1rem', fontSize: '1rem' }}>
              {step === 'forgot' ? '🔑 Forgot Password' : '🔒 Reset Password'}
            </h3>
            {step === 'forgot' ? (
              <>
                <div className="form-group">
                  <label>Enter your registered email</label>
                  <input type="email" placeholder="your@email.com" value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleForgot}>
                  Get Reset Token
                </button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Reset Token</label>
                  <input type="text" value={resetToken}
                    onChange={e => setResetToken(e.target.value)}
                    placeholder="Paste token here" />
                  <small style={{ color: '#6b7280' }}>In production this arrives via email</small>
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password" />
                </div>
                <button className="btn btn-success" style={{ width: '100%' }} onClick={handleReset}>
                  Reset Password
                </button>
              </>
            )}
            <button onClick={() => { setShowForgot(false); setStep('forgot'); }}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginTop: '0.75rem', fontSize: '0.875rem' }}>
              ← Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}