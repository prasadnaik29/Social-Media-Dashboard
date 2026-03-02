import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!token) {
      socket?.disconnect();
      setSocket(null);
      return;
    }

    const s = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    s.on('connect', () => console.log('🔌 Socket connected'));
    s.on('userOnline',  ({ userId }) => setOnlineUsers(prev => [...new Set([...prev, userId])]));
    s.on('userOffline', ({ userId }) => setOnlineUsers(prev => prev.filter(id => id !== userId)));
    s.on('connect_error', err => console.error('Socket error:', err.message));

    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
