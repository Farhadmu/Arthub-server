// ai.js — All AI endpoints for ArtHub
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { generateArtworkMetadata } = require('../services/artworkAiService');
const { getPersonalizedRecommendations } = require('../services/recommendationService');
const { searchVisuallySimilarArtworks } = require('../services/visualSearchService');
const { handleCuratorChat, parseCuratorIntent } = require('../services/aiAssistantService');
const { generateArtistInsights } = require('../services/artistAiInsightsService');
const Artwork = require('../models/Artwork');

// 1. AI Artwork Metadata Generator (artist only)
router.post('/generate-artwork-metadata', auth, authorize('artist'), async (req, res) => {
  try {
    const { imageUrl, initialTitle, category, hint } = req.body;
    const metadata = await generateArtworkMetadata({
      imageUrl,
      initialTitle,
      category,
      hint,
    });
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ message: error.message || 'AI metadata generation failed' });
  }
});

// 2. AI Visual Search (public)
router.post('/visual-search', async (req, res) => {
  try {
    const { imageInput, limit = 8 } = req.body;
    if (!imageInput) {
      return res.status(400).json({ message: 'Image data or URL required for visual search' });
    }
    const results = await searchVisuallySimilarArtworks({ imageInput, limit: Number(limit) });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Visual search failed' });
  }
});

// 3. AI Art Assistant / Curator Chat (public / optional auth)
router.post('/assistant/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }
    const response = await handleCuratorChat({ message, conversationHistory: history || [] });
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message || 'AI curator chat failed' });
  }
});

// 4. Personalized Recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { targetArtworkId, limit = 6 } = req.query;
    const userId = req.headers.authorization ? req.user?._id : null;
    const data = await getPersonalizedRecommendations({
      userId,
      targetArtworkId,
      limit: Number(limit),
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load recommendations' });
  }
});

// 5. AI Artist Insights (artist only)
router.get('/artist-insights', auth, authorize('artist'), async (req, res) => {
  try {
    const insights = await generateArtistInsights(req.user._id);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to generate artist insights' });
  }
});

// 6. AI Smart Search (natural language search query)
router.get('/smart-search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Search query parameter (q) is required' });
    }

    const filters = parseCuratorIntent(q);
    const mongoQuery = { isPublished: true };

    if (filters.maxPrice !== undefined || filters.minPrice !== undefined) {
      mongoQuery.price = {};
      if (filters.minPrice !== undefined) mongoQuery.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) mongoQuery.price.$lte = filters.maxPrice;
    }

    if (filters.category) {
      mongoQuery.category = filters.category;
    }

    const orClauses = [];
    if (filters.styles?.length) {
      filters.styles.forEach(s => {
        orClauses.push({ style: { $regex: s, $options: 'i' } });
        orClauses.push({ tags: s });
      });
    }
    if (filters.moods?.length) {
      filters.moods.forEach(m => {
        orClauses.push({ mood: { $regex: m, $options: 'i' } });
        orClauses.push({ tags: m });
      });
    }
    if (filters.colors?.length) {
      filters.colors.forEach(c => {
        orClauses.push({ tags: c });
      });
    }

    if (orClauses.length) {
      mongoQuery.$or = orClauses;
    }

    const artworks = await Artwork.find(mongoQuery)
      .sort({ views: -1, createdAt: -1 })
      .limit(20)
      .populate('artist', 'name avatar');

    res.json({
      parsedFilters: filters,
      total: artworks.length,
      artworks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Smart search failed' });
  }
});

// 7. AI Audio Museum Guide Narration
router.get('/audio-guide/:artworkId', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.artworkId);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    const { generateCuratorNarrative } = require('../services/audioGuideService');
    const narrative = generateCuratorNarrative(artwork);

    res.json(narrative);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Audio narrative generation failed' });
  }
});

// Helper: Hex to RGB
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.substring(0, 2), 16),
      parseInt(clean.substring(2, 4), 16),
      parseInt(clean.substring(4, 6), 16),
    ];
  }
  return [128, 128, 128];
}

// 8. Color Palette Search (Interior Design Color Matcher)
router.get('/palette-search', async (req, res) => {
  try {
    const { hex = '#1A2238', tolerance = 120, limit = 12 } = req.query;
    const targetRgb = hexToRgb(hex);

    const artworks = await Artwork.find({
      isPublished: true,
      colorPalette: { $exists: true, $not: { $size: 0 } },
    }).populate('artist', 'name avatar');

    // Rank by color distance to target color
    const scored = artworks.map((art) => {
      let minDistance = 999999;
      (art.colorPalette || []).forEach((swatch) => {
        const swatchRgb = hexToRgb(swatch);
        const distance = Math.sqrt(
          Math.pow(targetRgb[0] - swatchRgb[0], 2) +
          Math.pow(targetRgb[1] - swatchRgb[1], 2) +
          Math.pow(targetRgb[2] - swatchRgb[2], 2)
        );
        if (distance < minDistance) minDistance = distance;
      });

      return {
        artwork: art,
        colorDistance: Math.round(minDistance),
        matchPercentage: Math.max(10, Math.min(100, Math.round(100 - (minDistance / 441) * 100))),
      };
    });

    // Filter and sort by closest match
    scored.sort((a, b) => a.colorDistance - b.colorDistance);
    const results = scored.slice(0, Number(limit));

    res.json({
      targetHex: hex,
      totalMatches: results.length,
      artworks: results.map((r) => ({
        ...r.artwork.toObject(),
        matchPercentage: r.matchPercentage,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Palette search failed' });
  }
});

module.exports = router;
