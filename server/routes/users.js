import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'username avatar fullName')
      .populate('following', 'username avatar fullName');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Search users
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
    }).select('username fullName avatar isOnline').limit(10);
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get user by username
router.get('/:username', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'username avatar fullName')
      .populate('following', 'username avatar fullName');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const posts = await Post.find({ author: user._id })
      .populate('author', 'username avatar fullName')
      .sort({ createdAt: -1 });
    res.json({ user, posts });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update profile
router.put('/me/profile', protect, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const updates = { fullName: req.body.fullName, bio: req.body.bio };
    if (req.files?.avatar)      updates.avatar = `/uploads/${req.files.avatar[0].filename}`;
    if (req.files?.coverPhoto)  updates.coverPhoto = `/uploads/${req.files.coverPhoto[0].filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Follow / Unfollow
router.post('/:id/follow', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: "You can't follow yourself" });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const alreadyFollowing = target.followers.includes(req.user._id);
    if (alreadyFollowing) {
      // Unfollow
      target.followers.pull(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: target._id } });
    } else {
      // Follow
      target.followers.push(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $push: { following: target._id } });
    }
    await target.save();
    res.json({ following: !alreadyFollowing, followersCount: target.followers.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get suggested users (not following)
router.get('/suggestions/list', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const exclude = [...me.following, req.user._id];
    const suggestions = await User.find({ _id: { $nin: exclude } })
      .select('username fullName avatar')
      .limit(5);
    res.json(suggestions);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
