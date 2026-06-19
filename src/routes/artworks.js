const express = require('express');
const router = express.Router();
const Artwork = require('../models/Artwork');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Get all artworks (public — search, filter, sort, pagination)
router.get('/', async (req, res) => {
  try {
    const {
      search, category, minPrice, maxPrice,
      sort = 'newest', page = 1, limit = 12,
    } = req.query;

    const query = { isPublished: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artistName: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') query.category = category;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price-low') sortOption = { price: 1 };
    else if (sort === 'price-high') sortOption = { price: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Artwork.countDocuments(query);
    const artworks = await Artwork.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate('artist', 'name avatar email');

    res.json({
      artworks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get featured artworks
router.get('/featured', async (req, res) => {
  try {
    const artworks = await Artwork.find({ isPublished: true, isSold: false })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('artist', 'name avatar');
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get top artists (by sales; falls back to newest artists if no sales yet)
router.get('/top-artists', async (req, res) => {
  try {
    const byTransaction = await Transaction.aggregate([
      { $match: { type: 'purchase' } },
      { $group: { _id: '$artist', count: { $sum: 1 }, totalSales: { $sum: '$amount' } } },
      { $sort: { totalSales: -1 } },
      { $limit: 3 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'artistInfo' } },
      { $unwind: '$artistInfo' },
      {
        $project: {
          _id: 1,
          name: '$artistInfo.name',
          avatar: '$artistInfo.avatar',
          email: '$artistInfo.email',
          totalSales: 1,
          count: 1,
        },
      },
    ]);

    if (byTransaction.length > 0) {
      return res.json(byTransaction);
    }

    // Fallback: show newest artists even if no sales yet
    const fallback = await User.find({ role: 'artist' })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name avatar email');

    res.json(fallback.map(a => ({
      _id: a._id,
      name: a.name,
      avatar: a.avatar,
      email: a.email,
      totalSales: 0,
      count: 0,
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get artist's own artworks (auth required)
router.get('/artist/my-artworks', auth, authorize('artist'), async (req, res) => {
  try {
    const artworks = await Artwork.find({ artist: req.user._id }).sort({ createdAt: -1 });
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get ALL artworks for admin (includes sold & unpublished)
router.get('/admin/all', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Artwork.countDocuments();
    const artworks = await Artwork.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('artist', 'name avatar email');
    res.json({ artworks, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get artworks by artist ID (public)
router.get('/artist/:artistId', async (req, res) => {
  try {
    const artworks = await Artwork.find({
      artist: req.params.artistId,
      isPublished: true,
    }).sort({ createdAt: -1 });
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single artwork
router.get('/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id).populate('artist', 'name avatar email');
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });
    res.json(artwork);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create artwork (artist only)
router.post('/', auth, authorize('artist'), async (req, res) => {
  try {
    const { title, description, price, category, image } = req.body;
    const artwork = new Artwork({
      title, description, price, category, image,
      artist: req.user._id,
      artistName: req.user.name,
    });
    await artwork.save();
    await artwork.populate('artist', 'name avatar email');
    res.status(201).json(artwork);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update artwork (artist only — own artwork)
router.put('/:id', auth, authorize('artist'), async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });

    if (artwork.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this artwork' });
    }

    const { title, description, price, category, image } = req.body;
    if (title) artwork.title = title;
    if (description) artwork.description = description;
    if (price !== undefined) artwork.price = price;
    if (category) artwork.category = category;
    if (image) artwork.image = image;

    await artwork.save();
    await artwork.populate('artist', 'name avatar email');
    res.json(artwork);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete artwork (artist own or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });

    if (artwork.artist.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this artwork' });
    }

    await Artwork.findByIdAndDelete(req.params.id);
    res.json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;