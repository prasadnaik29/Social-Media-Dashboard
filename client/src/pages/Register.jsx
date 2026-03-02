import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

export default function Register() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/register', form);
      login(data.token, data.user);
      toast.success(`Welcome to Nexus, ${data.user.username}! 🎉`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const field = (id, label, Icon, type, key, placeholder) => (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          id={id}
          className="input"
          style={{ paddingLeft: 40 }}
          type={type}
          placeholder={placeholder}
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          required={key !== 'fullName'}
        />
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <h1>✦ Nexus</h1>
          <p>Create your account today</p>
        </div>
        <form onSubmit={handleSubmit}>
          {field('reg-fullname', 'Full Name', User, 'text', 'fullName', 'Your full name')}
          {field('reg-username', 'Username', User, 'text', 'username', 'your_handle')}
          {field('reg-email', 'Email', Mail, 'email', 'email', 'you@example.com')}
          {field('reg-password', 'Password', Lock, 'password', 'password', 'At least 6 characters')}
          <button id="register-submit" className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (<><UserPlus size={16} /> Create Account</>)}
          </button>
        </form>
        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
