import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

// One page used for both login and registration
export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const { saveLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api(isRegister ? '/auth/register' : '/auth/login', { method: 'POST', body: form });
      saveLogin(data);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h2>{isRegister ? 'Create your student account' : 'Log in to take your exam'}</h2>

        {error && <div className="alert alert-error">{error}</div>}

        {isRegister && (
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={6} value={form.password} onChange={handleChange} required />
        </div>

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
        </button>

        <p className="auth-switch">
          {isRegister ? (
            <>Already registered? <Link to="/login">Log in</Link></>
          ) : (
            <>New student? <Link to="/register">Create an account</Link></>
          )}
        </p>
      </form>
    </div>
  );
}
