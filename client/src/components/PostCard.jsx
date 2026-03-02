import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, Trash2, ChevronDown, ChevronUp, Send, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

function AvatarEl({ user, size = 'sm' }) {
  if (user?.avatar) return <img src={user.avatar} className={`avatar avatar-${size}`} alt={user.username} />;
  const initials = (user?.fullName || user?.username || '?').charAt(0).toUpperCase();
  return <div className={`avatar avatar-${size}`}>{initials}</div>;
}

export default function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.likes?.includes(user._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    try {
      const { data } = await axios.post(`/api/posts/${post._id}/like`);
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch { toast.error('Failed to like post'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/api/posts/${post._id}/comment`, { text: commentText });
      setComments(prev => [...prev, data]);
      setCommentText('');
      setShowComments(true);
    } catch { toast.error('Failed to comment'); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(`/api/posts/${post._id}`);
      toast.success('Post deleted');
      onDeleted?.(post._id);
    } catch { toast.error('Failed to delete'); }
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <div className="post-card fade-in">
      <div className="post-header">
        <div className="post-author">
          <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.author.username}`)}>
            <AvatarEl user={post.author} size="sm" />
          </div>
          <div className="post-author-info">
            <div className="name" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.author.username}`)}>
              {post.author.fullName || post.author.username}
            </div>
            <div className="time">@{post.author.username} · {timeAgo}</div>
          </div>
        </div>
        {post.author._id === user._id && (
          <button onClick={handleDelete} className="btn btn-icon" style={{ color: 'var(--text-muted)' }}>
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {post.content && <div className="post-content">{post.content}</div>}
      {post.image && <img src={post.image} className="post-image" alt="Post" />}

      <div className="post-actions">
        <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
          <Heart size={18} fill={liked ? '#ec4899' : 'none'} />
          {likesCount > 0 && <span>{likesCount}</span>}
        </button>
        <button className="action-btn" onClick={() => setShowComments(!showComments)}>
          <MessageCircle size={18} />
          {comments.length > 0 && <span>{comments.length}</span>}
          {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {comments.map((c, i) => (
            <div key={i} className="comment-item">
              <AvatarEl user={c.user} size="sm" />
              <div className="comment-body">
                <div className="comment-author">@{c.user?.username}</div>
                <div className="comment-text">{c.text}</div>
              </div>
            </div>
          ))}
          <form className="comment-input-row" onSubmit={handleComment}>
            <AvatarEl user={user} size="sm" />
            <input
              className="input"
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
              placeholder="Write a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
