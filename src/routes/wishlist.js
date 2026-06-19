const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const { auth } = require('../middleware/auth');

// Get user's wishlist
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'wishlist',
        populate: { path: 'artist', select: 'name' }
      });
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add to wishlist
router.post('/:artworkId', auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.artworkId);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    const user = await User.findById(req.user._id);
    if (user.wishlist.includes(req.params.artworkId)) {
      return res.status(400).json({ message: 'Already in wishlist' });
    }

    user.wishlist.push(req.params.artworkId);
    await user.save();

    res.json({ message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove from wishlist
router.delete('/:artworkId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(
      id => id.toString() !== req.params.artworkId
    );
    await user.save();

    res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
