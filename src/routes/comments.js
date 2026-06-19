const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');

// Get comments for an artwork
router.get('/artwork/:artworkId', async (req, res) => {
  try {
    const comments = await Comment.find({ artwork: req.params.artworkId })
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment (must have purchased the artwork)
router.post('/artwork/:artworkId', auth, async (req, res) => {
  try {
    const { comment } = req.body;

    // Check if user purchased this artwork
    const purchase = await Transaction.findOne({
      artwork: req.params.artworkId,
      user: req.user._id,
      type: 'purchase'
    });

    if (!purchase) {
      return res.status(403).json({ message: 'You can only comment on artworks you have purchased' });
    }

    // Check if user already commented
    const existing = await Comment.findOne({
      artwork: req.params.artworkId,
      user: req.user._id
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already commented on this artwork' });
    }

    const newComment = new Comment({
      artwork: req.params.artworkId,
      user: req.user._id,
      userName: req.user.name,
      userAvatar: req.user.avatar,
      comment
    });

    await newComment.save();
    await newComment.populate('user', 'name avatar');

    res.status(201).json(newComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update comment
router.put('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    comment.comment = req.body.comment;
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
