const express = require('express');
const router = express.Router();
const Artwork = require('../models/Artwork');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Utility to escape regex characters to prevent ReDoS attacks
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Get all artworks (public — search, filter, sort, pagination)
router.get('/', async (req, res) => {
  try {
    const {
      search, category, style, mood, tag, minPrice, maxPrice,
      sort = 'newest', page = 1, limit = 12,
    } = req.query;

    const query = { isPublished: true };

    if (search && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      query.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { artistName: { $regex: sanitized, $options: 'i' } },
        { tags: { $regex: sanitized, $options: 'i' } },
        { style: { $regex: sanitized, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') query.category = category;
    if (style && style !== 'All') query.style = style;
    if (mood && mood !== 'All') query.mood = mood;
    if (tag) query.tags = tag.toLowerCase();

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Math.max(0, Number(minPrice));
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price-low') sortOption = { price: 1 };
    else if (sort === 'price-high') sortOption = { price: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'popular') sortOption = { views: -1, createdAt: -1 };

    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit) || 12));
    const skip = (parsedPage - 1) * parsedLimit;

    const total = await Artwork.countDocuments(query);
    const artworks = await Artwork.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parsedLimit)
      .populate('artist', 'name avatar email');

    res.json({
      artworks,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Increment artwork view count (public)
router.post('/:id/view', async (req, res) => {
  try {
    const artwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });
    res.json({ views: artwork.views });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get featured artworks
router.get('/featured', async (req, res) => {
  try {
    const artworks = await Artwork.find({ isPublished: true, isSold: false })
      .sort({ featured: -1, views: -1, createdAt: -1 })
      .limit(8)
      .populate('artist', 'name avatar');
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get curated Spotlight Masterpiece of the Week for home page
router.get('/spotlight', async (req, res) => {
  try {
    let spotlight = await Artwork.findOne({ isPublished: true, featured: true })
      .sort({ views: -1, createdAt: -1 })
      .populate('artist', 'name avatar email bio');

    if (!spotlight) {
      spotlight = await Artwork.findOne({ isPublished: true })
        .sort({ createdAt: -1 })
        .populate('artist', 'name avatar email bio');
    }

    if (!spotlight) {
      return res.status(404).json({ message: 'No spotlight artwork found' });
    }

    res.json({
      artwork: spotlight,
      curatorVerdict: 'Chosen for its superlative balance of chiaroscuro lighting, emotional gravitas, and museum-grade tactile execution.',
      weekNumber: Math.ceil((new Date().getDate()) / 7),
      verifiedProvenance: true,
      has3DPreview: true,
      hasAudioGuide: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get category metrics and live counts for home exploration
router.get('/categories/metrics', async (req, res) => {
  try {
    const metrics = await Artwork.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          sampleImage: { $first: '$image' },
          styles: { $addToSet: '$style' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(metrics.map(m => ({
      name: m._id,
      count: m.count,
      avgPrice: Math.round(m.avgPrice || 0),
      minPrice: m.minPrice || 0,
      image: m.sampleImage,
      styles: (m.styles || []).slice(0, 3)
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get top artists (by sales; falls back to view-count or newest artists)
router.get('/top-artists', async (req, res) => {
  try {
    const byTransaction = await Transaction.aggregate([
      { $match: { type: 'purchase' } },
      { $group: { _id: '$artist', count: { $sum: 1 }, totalSales: { $sum: '$amount' } } },
      { $sort: { totalSales: -1 } },
      { $limit: 4 },
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

    // Fallback: show active artists
    const fallback = await User.find({ role: 'artist' })
      .sort({ createdAt: -1 })
      .limit(4)
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
    const {
      title, description, price, category, subcategory, image,
      tags, style, mood, colorPalette, altText, aiGenerated,
    } = req.body;

    if (!title || !description || price === undefined || !image || !category) {
      return res.status(400).json({ message: 'Title, description, price, category, and image are required.' });
    }

    const artwork = new Artwork({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      subcategory: subcategory || '',
      image,
      artist: req.user._id,
      artistName: req.user.name,
      tags: Array.isArray(tags) ? tags.map(t => t.toLowerCase().trim()) : [],
      style: style || 'Contemporary',
      mood: mood || 'Inspiring',
      colorPalette: Array.isArray(colorPalette) ? colorPalette : [],
      altText: altText || '',
      aiGenerated: aiGenerated || { isAiAssisted: false },
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

    const {
      title, description, price, category, subcategory, image,
      tags, style, mood, colorPalette, altText, isPublished,
    } = req.body;

    if (title) artwork.title = title.trim();
    if (description) artwork.description = description.trim();
    if (price !== undefined) artwork.price = Number(price);
    if (category) artwork.category = category;
    if (subcategory !== undefined) artwork.subcategory = subcategory;
    if (image) artwork.image = image;
    if (tags !== undefined) artwork.tags = Array.isArray(tags) ? tags.map(t => t.toLowerCase().trim()) : [];
    if (style) artwork.style = style;
    if (mood) artwork.mood = mood;
    if (colorPalette) artwork.colorPalette = colorPalette;
    if (altText !== undefined) artwork.altText = altText;
    if (isPublished !== undefined) artwork.isPublished = Boolean(isPublished);

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