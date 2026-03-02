import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Suggestions from '../components/Suggestions';
import { Image, Send, X, Sparkles } from 'lucide-react';

function AvatarEl({ user, size = 'md' }) {
  if (user?.avatar) return <img src={user.avatar} className={`avatar avatar-${size}`} alt={user.username} />;
  const initials = (user?.fullName || user?.username || '?').charAt(0).toUpperCase();
  return <div className={`avatar avatar-${size}`}>{initials}</div>;
}

function CreatePost({ onPosted }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('content', content);
      if (imageFile) fd.append('image', imageFile);
      const { data } = await axios.post('/api/posts', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onPosted(data);
      setContent('');
      setImageFile(null);
      setImagePreview('');
      toast.success('Post published! ✨');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to post'); }
    setLoading(false);
  };

  return (
    <div className="create-post">
      <div className="create-post-top">
        <AvatarEl user={user} size="md" />
        <div style={{ flex: 1 }}>
          <textarea
            id="create-post-content"
            className="input"
            placeholder="What's on your mind?"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            style={{ resize: 'none', borderRadius: 12 }}
          />
          {imagePreview && (
            <div style={{ position: 'relative', marginTop: 8, display: 'inline-block' }}>
              <img src={imagePreview} style={{ maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} alt="preview" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(''); }}
                style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', color: '#fff', padding: 4, cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="create-post-actions">
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current.click()}>
            <Image size={15} /> Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
        </div>
        <button id="create-post-submit" className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading || (!content.trim() && !imageFile)}>
          {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Sparkles size={14} /> Post</>}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeed = async (p = 1, append = false) => {
    try {
      const { data } = await axios.get(`/api/posts/feed?page=${p}&limit=10`);
      setPosts(prev => append ? [...prev, ...data.posts] : data.posts);
      setHasMore(p < data.totalPages);
    } catch { toast.error('Failed to load feed'); }
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => { fetchFeed(); }, []);

  const handlePosted = (post) => setPosts(prev => [post, ...prev]);
  const handleDeleted = (id) => setPosts(prev => prev.filter(p => p._id !== id));

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    setLoadingMore(true);
    fetchFeed(next, true);
  };

  return (
    <div className="feed-layout">
      <div className="feed-col">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Home Feed</h2>
        </div>
        <CreatePost onPosted={handlePosted} />
        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🌟</div>
            <h3 style={{ marginBottom: 8 }}>Your feed is empty</h3>
            <p>Follow some users to see their posts here, or share your first post!</p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard key={post._id} post={post} onDeleted={handleDeleted} />
            ))}
            {hasMore && (
              <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore} style={{ alignSelf: 'center' }}>
                {loadingMore ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Load More'}
              </button>
            )}
          </>
        )}
      </div>
      <div className="right-col">
        <Suggestions />
        <div className="card" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>✦ Nexus</div>
          Share your moments, connect with people who share your passion.
          <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: '0.78rem' }}>© 2026 Nexus Social</div>
        </div>
      </div>
    </div>
  );
}
