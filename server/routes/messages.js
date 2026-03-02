import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all conversations for current user
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'username avatar fullName isOnline')
      .sort({ lastMessageAt: -1 });
    res.json(conversations);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get or create conversation with a user
router.post('/conversations', protect, async (req, res) => {
  try {
    const { userId } = req.body;
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId], $size: 2 },
    }).populate('participants', 'username avatar fullName isOnline');

    if (!conversation) {
      conversation = await Conversation.create({ participants: [req.user._id, userId] });
      await conversation.populate('participants', 'username avatar fullName isOnline');
    }
    res.json(conversation);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get messages in a conversation
router.get('/conversations/:convId/messages', protect, async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.convId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 });
    // Mark as read
    await Message.updateMany(
      { conversationId: req.params.convId, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );
    res.json(messages);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Send message (REST fallback)
router.post('/conversations/:convId/messages', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const message = await Message.create({
      conversationId: req.params.convId,
      sender: req.user._id,
      text,
    });
    await Conversation.findByIdAndUpdate(req.params.convId, {
      lastMessage: text,
      lastMessageAt: new Date(),
    });
    await message.populate('sender', 'username avatar');
    res.status(201).json(message);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
