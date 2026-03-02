import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const onlineUsers = new Map(); // userId -> socketId

export const initSocket = (io) => {
  // Auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 Connected: ${userId}`);

    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('userOnline', { userId });

    // Join personal room so we can target this user precisely
    socket.join(userId);

    // ── Send message ──
    socket.on('sendMessage', async ({ conversationId, text, receiverId }) => {
      try {
        const message = await Message.create({
          conversationId,
          sender: userId,
          text,
        });

        await message.populate('sender', 'username avatar fullName');

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: text,
          lastMessageAt: new Date(),
        });

        // Emit only to receiver's room (sender already has optimistic msg)
        if (receiverId) {
          io.to(receiverId).emit('newMessage', message);
        }

        // Also emit back to sender with the saved doc so they can de-optimise if needed
        // We tag it so the client can skip adding a duplicate
        socket.emit('messageSaved', { ...message.toObject(), conversationId });

      } catch (err) {
        socket.emit('messageError', { message: err.message });
      }
    });

    // ── Typing indicators ──
    socket.on('typing', ({ conversationId, receiverId }) => {
      if (receiverId) io.to(receiverId).emit('userTyping', { conversationId, userId });
    });

    socket.on('stopTyping', ({ conversationId, receiverId }) => {
      if (receiverId) io.to(receiverId).emit('userStopTyping', { conversationId, userId });
    });

    // ── Disconnect ──
    socket.on('disconnect', async () => {
      console.log(`🔌 Disconnected: ${userId}`);
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit('userOffline', { userId });
    });
  });
};
