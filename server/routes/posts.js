import express from 'express';
import Post from '../models/Post.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Get feed (posts from following + own)
router.get('/feed', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const feedUsers = [...(req.user.following || []), req.user._id];
    const posts = await Post.find({ author: { $in: feedUsers } })
      .populate('author', 'username avatar fullName')
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Post.countDocuments({ author: { $in: feedUsers } });
    res.json({ posts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create post
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { content, tags } = req.body;
    if (!content && !req.file) return res.status(400).json({ message: 'Post needs content or image' });
    const post = await Post.create({
      author:  req.user._id,
      content: content || '',
      image:   req.file ? `/uploads/${req.file.filename}` : '',
      tags:    tags ? tags.split(',').map(t => t.trim()) : [],
    });
    await post.populate('author', 'username avatar fullName');
    res.status(201).json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single post
router.get('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar fullName')
      .populate('comments.user', 'username avatar fullName');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Like / Unlike
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const liked = post.likes.includes(req.user._id);
    if (liked) post.likes.pull(req.user._id);
    else post.likes.push(req.user._id);
    await post.save();
    res.json({ liked: !liked, likesCount: post.likes.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.comments.push({ user: req.user._id, text });
    await post.save();
    await post.populate('comments.user', 'username avatar fullName');
    res.json(post.comments[post.comments.length - 1]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete post
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
