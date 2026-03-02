import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { Edit3, Camera, UserPlus, UserCheck, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AvatarEl({ user, size = 'xl' }) {
  if (user?.avatar) return <img src={user.avatar} className={`avatar avatar-${size}`} alt={user.username} />;
  const initials = (user?.fullName || user?.username || '?').charAt(0).toUpperCase();
  return <div className={`avatar avatar-${size}`}>{initials}</div>;
}

export default function Profile() {
  const { username } = useParams();
  const { user: me, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', bio: '' });
  const [saving, setSaving]     = useState(false);

  const avatarRef    = useRef();
  const coverRef     = useRef();
  const [avatarPrev, setAvatarPrev]   = useState('');
  const [coverPrev, setCoverPrev]     = useState('');
  const [avatarFile, setAvatarFile]   = useState(null);
  const [coverFile, setCoverFile]     = useState(null);

  const isMe = me?.username === username;

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/users/${username}`)
      .then(({ data }) => {
        setProfile(data.user);
        setPosts(data.posts);
        setIsFollowing(data.user.followers?.some(f => f._id === me?._id || f === me?._id));
        setEditForm({ fullName: data.user.fullName || '', bio: data.user.bio || '' });
      })
      .catch(() => toast.error('User not found'))
      .finally(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    try {
      const { data } = await axios.post(`/api/users/${profile._id}/follow`);
      setIsFollowing(data.following);
      setProfile(prev => ({
        ...prev,
        followers: data.following
          ? [...(prev.followers || []), { _id: me._id }]
          : (prev.followers || []).filter(f => (f._id || f) !== me._id),
      }));
      toast.success(data.following ? `Following @${profile.username}!` : `Unfollowed @${profile.username}`);
    } catch { toast.error('Failed'); }
  };

  const handleMessage = async () => {
    try {
      const { data } = await axios.post('/api/messages/conversations', { userId: profile._id });
      navigate(`/messages?conv=${data._id}`);
    } catch { toast.error('Failed to open conversation'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('fullName', editForm.fullName);
      fd.append('bio', editForm.bio);
      if (avatarFile) fd.append('avatar', avatarFile);
      if (coverFile)  fd.append('coverPhoto', coverFile);
      const { data } = await axios.put('/api/users/me/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(data);
      updateUser(data);
      setEditing(false);
      toast.success('Profile updated! ✨');
    } catch { toast.error('Failed to update profile'); }
    setSaving(false);
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!profile) return <div className="empty-state"><p>User not found.</p></div>;

  const coverSrc = coverPrev || profile.coverPhoto;
  const avatarSrc = avatarPrev || profile.avatar;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Cover */}
      <div className="profile-cover" style={{ cursor: isMe && editing ? 'pointer' : 'default' }}
        onClick={() => isMe && editing && coverRef.current.click()}>
        {coverSrc
          ? <img src={coverSrc} alt="Cover" />
          : <div style={{ background: 'var(--gradient)', width: '100%', height: '100%' }} />}
        {isMe && editing && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 'inherit' }}>
            <Camera size={28} color="white" />
          </div>
        )}
        <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { setCoverFile(e.target.files[0]); setCoverPrev(URL.createObjectURL(e.target.files[0])); }} />
      </div>

      {/* Profile info card */}
      <div className="profile-info-card">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div className="profile-avatar-wrap">
            <div style={{ cursor: isMe && editing ? 'pointer' : 'default', position: 'relative' }}
              onClick={() => isMe && editing && avatarRef.current.click()}>
              {avatarSrc
                ? <img src={avatarSrc} className="avatar avatar-xl" alt="Avatar" />
                : <AvatarEl user={profile} size="xl" />}
              {isMe && editing && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={20} color="white" />
                </div>
              )}
            </div>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { setAvatarFile(e.target.files[0]); setAvatarPrev(URL.createObjectURL(e.target.files[0])); }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {isMe ? (
              editing
                ? <>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                      {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Save'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                  </>
                : <button id="edit-profile-btn" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                    <Edit3 size={14} /> Edit Profile
                  </button>
            ) : (
              <>
                <button id="follow-btn" className={`btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}`} onClick={handleFollow}>
                  {isFollowing ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleMessage}>
                  <MessageCircle size={14} /> Message
                </button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div style={{ marginTop: 8 }}>
            <input className="input" style={{ marginBottom: 10 }} placeholder="Full Name"
              value={editForm.fullName} onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))} />
            <textarea className="input" placeholder="Bio (max 200 chars)"
              value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
              maxLength={200} rows={2} />
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{profile.fullName || profile.username}</h2>
            <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>@{profile.username}</div>
            {profile.bio && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 10 }}>{profile.bio}</p>}
          </>
        )}

        <div className="profile-stats">
          <div className="stat-item"><div className="num">{posts.length}</div><div className="label">Posts</div></div>
          <div className="stat-item"><div className="num">{profile.followers?.length || 0}</div><div className="label">Followers</div></div>
          <div className="stat-item"><div className="num">{profile.following?.length || 0}</div><div className="label">Following</div></div>
        </div>
      </div>

      {/* Posts */}
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontWeight: 700 }}>Posts</h3>
        {posts.length === 0
          ? <div className="empty-state"><div className="icon">📭</div><p>No posts yet.</p></div>
          : posts.map(p => <PostCard key={p._id} post={p} onDeleted={id => setPosts(prev => prev.filter(p => p._id !== id))} />)
        }
      </div>
    </div>
  );
}
