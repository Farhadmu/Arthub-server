const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Transaction = require('../models/Transaction');
const Artwork = require('../models/Artwork');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');
const { analyzeCommentContent } = require('../services/moderationService');

// Get comments for an artwork (only SAFE comments for public, or user's own)
router.get('/artwork/:artworkId', async (req, res) => {
  try {
    const comments = await Comment.find({
      artwork: req.params.artworkId,
      status: 'SAFE',
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment (must have purchased the artwork, runs AI moderation)
router.post('/artwork/:artworkId', auth, async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    // Check if user purchased this artwork
    const purchase = await Transaction.findOne({
      artwork: req.params.artworkId,
      user: req.user._id,
      type: 'purchase',
    });

    if (!purchase && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only comment on artworks you have purchased' });
    }

    // Check if user already commented
    const existing = await Comment.findOne({
      artwork: req.params.artworkId,
      user: req.user._id,
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already commented on this artwork' });
    }

    // AI Content Moderation Analysis
    const moderation = analyzeCommentContent(comment);

    if (moderation.status === 'BLOCKED') {
      return res.status(400).json({
        message: `Comment rejected: ${moderation.reason}`,
        moderationStatus: 'BLOCKED',
      });
    }

    const newComment = new Comment({
      artwork: req.params.artworkId,
      user: req.user._id,
      userName: req.user.name,
      userAvatar: req.user.avatar,
      comment: comment.trim(),
      status: moderation.status,
      moderationReason: moderation.reason,
      moderationScore: moderation.score,
      flaggedByAi: moderation.flaggedByAi,
    });

    await newComment.save();
    await newComment.populate('user', 'name avatar');

    // Notify the artist if comment is approved/safe
    const artwork = await Artwork.findById(req.params.artworkId);
    if (artwork && artwork.artist.toString() !== req.user._id.toString() && moderation.status === 'SAFE') {
      await Notification.create({
        recipient: artwork.artist,
        sender: req.user._id,
        type: 'NEW_COMMENT',
        title: 'New Collector Review',
        message: `${req.user.name} reviewed your artwork "${artwork.title}"`,
        link: `/artworks/${artwork._id}`,
      }).catch(() => {});
    }

    if (moderation.status === 'REVIEW') {
      return res.status(201).json({
        ...newComment.toJSON(),
        notice: 'Your comment contains sensitive elements and is pending administrator review before appearing publicly.',
      });
    }

    res.status(201).json(newComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Admin: Get all flagged comments for moderation queue
router.get('/admin/flagged', auth, authorize('admin'), async (req, res) => {
  try {
    const flagged = await Comment.find({ status: { $in: ['REVIEW', 'BLOCKED'] } })
      .sort({ createdAt: -1 })
      .populate('user', 'name email avatar')
      .populate('artwork', 'title image');
    res.json(flagged);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Moderate comment (approve as SAFE or mark as BLOCKED)
router.put('/:id/moderate', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['SAFE', 'BLOCKED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be SAFE or BLOCKED' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.status = status;
    comment.reviewedByAdmin = true;
    if (reason) comment.moderationReason = reason;
    await comment.save();

    res.json({ message: `Comment marked as ${status}`, comment });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update own comment
router.put('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    const moderation = analyzeCommentContent(req.body.comment || '');
    if (moderation.status === 'BLOCKED') {
      return res.status(400).json({ message: `Comment rejected: ${moderation.reason}` });
    }

    comment.comment = req.body.comment;
    comment.status = moderation.status;
    comment.moderationReason = moderation.reason;
    comment.flaggedByAi = moderation.flaggedByAi;
    await comment.save();
    await comment.populate('user', 'name avatar');

    res.json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
