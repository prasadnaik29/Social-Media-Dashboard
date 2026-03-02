import { NavLink, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, BarChart2, LogOut, User, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function AvatarEl({ user, size = 'sm' }) {
  if (user?.avatar) return <img src={user.avatar} className={`avatar avatar-${size}`} alt={user.username} />;
  const initials = (user?.fullName || user?.username || '?').charAt(0).toUpperCase();
  return <div className={`avatar avatar-${size}`}>{initials}</div>;
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    try {
      const { data } = await axios.get(`/api/users/search?q=${q}`);
      setSearchResults(data);
    } catch { }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out!');
    navigate('/login');
  };

  const navItems = [
    { to: '/',          Icon: Home,          label: 'Home'      },
    { to: '/messages',  Icon: MessageCircle, label: 'Messages'  },
    { to: '/analytics', Icon: BarChart2,     label: 'Analytics' },
    { to: `/profile/${user?.username}`, Icon: User, label: 'Profile' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">✦ Nexus</div>

      {/* Search */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            id="sidebar-search"
            className="input"
            style={{ paddingLeft: 36, fontSize: '0.82rem', padding: '9px 12px 9px 34px' }}
            placeholder="Search people..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
          />
        </div>
        {showSearch && searchResults.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', marginTop: 4, overflow: 'hidden',
            boxShadow: 'var(--shadow)',
          }}>
            {searchResults.map(u => (
              <div key={u._id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => { navigate(`/profile/${u.username}`); setShowSearch(false); setSearchQuery(''); }}
              >
                <AvatarEl user={u} size="sm" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.fullName}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>@{u.username}</div>
                </div>
                {u.isOnline && <div className="online-dot" style={{ position: 'static', marginLeft: 'auto' }} />}
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div className="sidebar-user" onClick={() => navigate(`/profile/${user?.username}`)}>
          <div style={{ position: 'relative' }}>
            <AvatarEl user={user} size="sm" />
            <div className="online-dot" />
          </div>
          <div className="sidebar-user-info">
            <div className="name">{user?.fullName || user?.username}</div>
            <div className="handle">@{user?.username}</div>
          </div>
        </div>
        <button
          id="sidebar-logout"
          className="nav-link"
          style={{ width: '100%', color: 'var(--error)', marginTop: 4, background: 'none', border: 'none' }}
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
