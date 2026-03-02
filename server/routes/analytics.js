import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Dashboard analytics for the current user
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Posts per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const postsOverTime = await Post.aggregate([
      { $match: { author: userId, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    // Total likes on all user posts
    const likeStats = await Post.aggregate([
      { $match: { author: userId } },
      { $project: { likesCount: { $size: '$likes' }, commentsCount: { $size: '$comments' } } },
      { $group: {
        _id: null,
        totalLikes: { $sum: '$likesCount' },
        totalComments: { $sum: '$commentsCount' },
        avgLikes: { $avg: '$likesCount' },
      }},
    ]);

    // Top 5 posts by likes
    const topPosts = await Post.find({ author: userId })
      .sort({ 'likes': -1 })
      .limit(5)
      .select('content image likes comments createdAt');

    // Follower growth (simplified: followers over time isn't tracked, return snapshot)
    const me = await User.findById(userId).populate('followers following');

    // Engagement by day of week
    const engagementByDay = await Post.aggregate([
      { $match: { author: userId } },
      { $group: {
        _id: { $dayOfWeek: '$createdAt' },
        posts: { $sum: 1 },
        likes: { $sum: { $size: '$likes' } },
      }},
      { $sort: { _id: 1 } },
    ]);

    res.json({
      overview: {
        totalPosts: await Post.countDocuments({ author: userId }),
        totalLikes: likeStats[0]?.totalLikes || 0,
        totalComments: likeStats[0]?.totalComments || 0,
        followers: me.followers.length,
        following: me.following.length,
        avgLikesPerPost: Math.round(likeStats[0]?.avgLikes || 0),
      },
      postsOverTime,
      topPosts,
      engagementByDay,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
