import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck } from 'lucide-react';

function AvatarEl({ user, size = 'sm' }) {
  if (user?.avatar) return <img src={user.avatar} className={`avatar avatar-${size}`} alt={user.username} />;
  const initials = (user?.fullName || user?.username || '?').charAt(0).toUpperCase();
  return <div className={`avatar avatar-${size}`}>{initials}</div>;
}

export default function Suggestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [followed, setFollowed] = useState({});

  useEffect(() => {
    axios.get('/api/users/suggestions/list')
      .then(r => setSuggestions(r.data))
      .catch(() => {});
  }, []);

  const handleFollow = async (userId, username) => {
    try {
      await axios.post(`/api/users/${userId}/follow`);
      setFollowed(p => ({ ...p, [userId]: !p[userId] }));
      toast.success(followed[userId] ? `Unfollowed @${username}` : `Following @${username}!`);
    } catch { toast.error('Failed'); }
  };

  if (!suggestions.length) return null;

  return (
    <div className="suggestions-card">
      <div className="suggestions-title">People You May Know</div>
      {suggestions.map(s => (
        <div key={s._id} className="suggestion-item">
          <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${s.username}`)}>
            <AvatarEl user={s} size="sm" />
          </div>
          <div className="info">
            <div className="name" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${s.username}`)}>{s.fullName || s.username}</div>
            <div className="handle">@{s.username}</div>
          </div>
          <button
            className={`btn btn-sm ${followed[s._id] ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => handleFollow(s._id, s.username)}
          >
            {followed[s._id] ? <UserCheck size={13} /> : <UserPlus size={13} />}
          </button>
        </div>
      ))}
    </div>
  );
}
