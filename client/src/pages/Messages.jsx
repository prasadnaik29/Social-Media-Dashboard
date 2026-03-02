import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, MessageCircle, Search, Plus, X, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/* ───────── tiny Avatar helper ───────── */
function Avatar({ user, size = 'md' }) {
  if (user?.avatar)
    return <img src={user.avatar} className={`avatar avatar-${size}`} alt={user.username} />;
  const letter = (user?.fullName || user?.username || '?').charAt(0).toUpperCase();
  return <div className={`avatar avatar-${size}`}>{letter}</div>;
}

/* ───────── New-conversation search modal ───────── */
function NewChatModal({ onClose, onConversationCreated }) {
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (q) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/users/search?q=${q}`);
      setResults(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const startChat = async (userId) => {
    try {
      const { data } = await axios.post('/api/messages/conversations', { userId });
      onConversationCreated(data);
      onClose();
    } catch { toast.error('Could not start conversation'); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.65)',
      zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        width: 400,
        maxWidth: '90vw',
        boxShadow: 'var(--shadow)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700 }}>New Message</h3>
          <button onClick={onClose} className="btn btn-icon" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            autoFocus
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Search people to message..."
            value={query}
            onChange={e => search(e.target.value)}
          />
        </div>

        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {loading && <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)' }}><div className="spinner" style={{ margin: '0 auto', width: 24, height: 24 }} /></div>}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontSize: '0.875rem' }}>No users found</div>
          )}
          {results.map(u => (
            <div key={u._id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 'var(--radius)',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => startChat(u._id)}
            >
              <div style={{ position: 'relative' }}>
                <Avatar user={u} size="md" />
                {u.isOnline && <div className="online-dot" />}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.fullName || u.username}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>@{u.username}</div>
              </div>
              <div style={{ marginLeft: 'auto', color: 'var(--accent-light)', fontSize: '0.8rem' }}>Message →</div>
            </div>
          ))}
          {!query && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Type a name or username to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── Main Messages Page ───────── */
export default function Messages() {
  const { user: me } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [searchParams] = useSearchParams();
  const preselectedConvId = searchParams.get('conv');

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv]       = useState(null);
  const [messages, setMessages]           = useState([]);
  const [text, setText]                   = useState('');
  const [loading, setLoading]             = useState(true);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const [isTyping, setIsTyping]           = useState(false);
  const [showNewChat, setShowNewChat]     = useState(false);

  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);

  /* ── Load conversations ── */
  useEffect(() => {
    axios.get('/api/messages/conversations')
      .then(({ data }) => {
        setConversations(data);
        if (preselectedConvId) {
          const found = data.find(c => c._id === preselectedConvId);
          if (found) setActiveConv(found);
        }
      })
      .catch(() => toast.error('Failed to load conversations'))
      .finally(() => setLoading(false));
  }, []);

  /* ── Load messages when conv changes ── */
  useEffect(() => {
    if (!activeConv) return;
    setMessages([]);
    setLoadingMsgs(true);
    axios.get(`/api/messages/conversations/${activeConv._id}/messages`)
      .then(({ data }) => setMessages(data))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoadingMsgs(false));
  }, [activeConv?._id]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Socket listeners ── */
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg) => {
      // Add to active chat if it belongs here
      if (activeConv && msg.conversationId === activeConv._id) {
        setMessages(prev => {
          // Deduplicate by checking if already present
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      // Update conversation list preview
      setConversations(prev => {
        const exists = prev.find(c => c._id === msg.conversationId);
        if (exists) {
          return prev.map(c =>
            c._id === msg.conversationId
              ? { ...c, lastMessage: msg.text, lastMessageAt: msg.createdAt }
              : c
          ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        }
        return prev;
      });
    };

    const onTyping     = ({ conversationId }) => { if (activeConv?._id === conversationId) setIsTyping(true); };
    const onStopTyping = ({ conversationId }) => { if (activeConv?._id === conversationId) setIsTyping(false); };

    socket.on('newMessage',      onNewMessage);
    socket.on('userTyping',      onTyping);
    socket.on('userStopTyping',  onStopTyping);

    return () => {
      socket.off('newMessage',     onNewMessage);
      socket.off('userTyping',     onTyping);
      socket.off('userStopTyping', onStopTyping);
    };
  }, [socket, activeConv?._id]);

  const getOtherUser = useCallback(
    (conv) => conv?.participants?.find(p => p._id !== me?._id),
    [me?._id]
  );

  /* ── Send message ── */
  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeConv || !socket) return;

    const other = getOtherUser(activeConv);

    // Optimistic UI: add to messages immediately
    const optimisticMsg = {
      _id: `optimistic-${Date.now()}`,
      conversationId: activeConv._id,
      sender: { _id: me._id, username: me.username, avatar: me.avatar },
      text: trimmed,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setText('');

    // Stop typing indicator
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('stopTyping', { conversationId: activeConv._id, receiverId: other?._id });
    }
    clearTimeout(typingTimer.current);

    socket.emit('sendMessage', {
      conversationId: activeConv._id,
      text: trimmed,
      receiverId: other?._id,
    });
  };

  /* ── Typing indicator ── */
  const handleTyping = (e) => {
    setText(e.target.value);
    if (!activeConv || !socket) return;
    const other = getOtherUser(activeConv);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { conversationId: activeConv._id, receiverId: other?._id });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('stopTyping', { conversationId: activeConv._id, receiverId: other?._id });
    }, 2000);
  };

  /* ── Handle new conversation from modal ── */
  const handleConversationCreated = (conv) => {
    setConversations(prev => {
      if (prev.find(c => c._id === conv._id)) return prev;
      return [conv, ...prev];
    });
    setActiveConv(conv);
  };

  /* ── Key handler: send on Enter ── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16 }}>Messages</h2>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: 16,
        flex: 1,
        minHeight: 0,
      }}>
        {/* ── Conversations panel ── */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Chats</span>
            <button
              id="new-conversation-btn"
              className="btn btn-primary btn-sm"
              onClick={() => setShowNewChat(true)}
              title="New conversation"
            >
              <Plus size={14} /> New
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <div className="spinner" />
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                <MessageCircle size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <p style={{ fontSize: '0.85rem' }}>No conversations yet</p>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => setShowNewChat(true)}>
                  <Plus size={13} /> Start one
                </button>
              </div>
            ) : (
              conversations.map(conv => {
                const other    = getOtherUser(conv);
                const isOnline = onlineUsers.includes(other?._id);
                const isActive = activeConv?._id === conv._id;
                return (
                  <div key={conv._id}
                    onClick={() => setActiveConv(conv)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 16px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: isActive ? 'var(--accent-glow)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar user={other} size="md" />
                      {isOnline && <div className="online-dot" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{other?.fullName || other?.username}</div>
                      <div style={{
                        color: 'var(--text-muted)', fontSize: '0.78rem',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {conv.lastMessage || 'Say hello!'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat window ── */}
        {activeConv ? (() => {
          const other    = getOtherUser(activeConv);
          const isOnline = onlineUsers.includes(other?._id);
          return (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minHeight: 0,
            }}>
              {/* Header */}
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                display: 'flex', alignItems: 'center', gap: 12,
                flexShrink: 0,
              }}>
                <div style={{ position: 'relative' }}>
                  <Avatar user={other} size="md" />
                  {isOnline && <div className="online-dot" />}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{other?.fullName || other?.username}</div>
                  <div style={{ fontSize: '0.75rem', color: isOnline ? 'var(--success)' : 'var(--text-muted)' }}>
                    {isOnline ? '● Online' : '○ Offline'}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '16px 20px',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                {loadingMsgs ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                    <div className="spinner" />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>👋</div>
                    <p style={{ fontSize: '0.875rem' }}>Say hello to {other?.fullName || other?.username}!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMine = (msg.sender?._id || msg.sender) === me._id;
                    return (
                      <div key={msg._id || i} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                      }}>
                        <div style={{
                          maxWidth: '70%',
                          padding: '10px 14px',
                          borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMine ? 'linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)' : 'var(--bg-hover)',
                          color: isMine ? '#fff' : 'var(--text-primary)',
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                          opacity: msg._id?.startsWith('optimistic') ? 0.75 : 1,
                        }}>
                          {msg.text}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ padding: '0 20px 8px', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {other?.username} is typing...
                </div>
              )}

              {/* Input area */}
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border)',
                display: 'flex', gap: 10, alignItems: 'center',
                flexShrink: 0,
              }}>
                <input
                  id="chat-input"
                  className="input"
                  style={{ flex: 1 }}
                  placeholder={`Message ${other?.username || ''}...`}
                  value={text}
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                />
                <button
                  id="chat-send-btn"
                  className="btn btn-primary"
                  style={{ padding: '10px 16px' }}
                  onClick={handleSend}
                  disabled={!text.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          );
        })() : (
          /* Empty state — no conv selected */
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, color: 'var(--text-muted)',
          }}>
            <MessageCircle size={56} strokeWidth={1} />
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              Your messages
            </h3>
            <p style={{ fontSize: '0.875rem', maxWidth: 280, textAlign: 'center' }}>
              Send private messages to friends and people you follow
            </p>
            <button className="btn btn-primary" onClick={() => setShowNewChat(true)}>
              <Plus size={16} /> New Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
