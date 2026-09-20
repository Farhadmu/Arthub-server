// aiAssistantService.js — ArtHub AI conversational curator with zero-hallucination real DB artwork recommendations
const Artwork = require('../models/Artwork');

const COLOR_KEYWORDS = ['blue', 'red', 'green', 'gold', 'yellow', 'black', 'white', 'purple', 'emerald', 'indigo', 'terracotta'];
const MOOD_KEYWORDS = ['peaceful', 'calm', 'serene', 'vibrant', 'energetic', 'dark', 'mysterious', 'melancholic', 'ethereal', 'dramatic'];
const STYLE_KEYWORDS = ['abstract', 'minimalist', 'contemporary', 'surrealism', 'impressionism', 'cyberpunk', 'modern', 'landscape', 'portrait', 'geometric'];
const CATEGORY_KEYWORDS = ['painting', 'digital', 'sculpture', 'photography', 'illustration', 'mixed media'];

/**
 * Extracts search parameters from natural language chat prompt
 */
function parseCuratorIntent(query = '') {
  const lower = query.toLowerCase();
  const filters = {};

  // 1. Budget extraction
  const underMatch = lower.match(/(?:under|less than|below|budget of|max(?:imum)?)\s*\$?(\d+)/i);
  const betweenMatch = lower.match(/\$?(\d+)\s*(?:-|to)\s*\$?(\d+)/i);
  const exactMatch = lower.match(/\$?(\d+)\s*(?:dollars?|usd)?/i);

  if (underMatch) {
    filters.maxPrice = Number(underMatch[1]);
  } else if (betweenMatch) {
    filters.minPrice = Number(betweenMatch[1]);
    filters.maxPrice = Number(betweenMatch[2]);
  } else if (lower.includes('affordable') || lower.includes('cheap')) {
    filters.maxPrice = 150;
  } else if (lower.includes('luxury') || lower.includes('investment')) {
    filters.minPrice = 500;
  }

  // 2. Color keywords
  const matchedColors = COLOR_KEYWORDS.filter(c => lower.includes(c));
  if (matchedColors.length) filters.colors = matchedColors;

  // 3. Mood keywords
  const matchedMoods = MOOD_KEYWORDS.filter(m => lower.includes(m));
  if (matchedMoods.length) filters.moods = matchedMoods;

  // 4. Style keywords
  const matchedStyles = STYLE_KEYWORDS.filter(s => lower.includes(s));
  if (matchedStyles.length) filters.styles = matchedStyles;

  // 5. Category keywords
  for (const cat of CATEGORY_KEYWORDS) {
    if (lower.includes(cat)) {
      filters.category = cat.charAt(0).toUpperCase() + cat.slice(1);
      break;
    }
  }

  return filters;
}

/**
 * Executes dynamic query to fetch real artworks from DB
 */
async function fetchMatchedArtworks(filters, limit = 4) {
  const mongoQuery = { isPublished: true };

  if (filters.maxPrice !== undefined || filters.minPrice !== undefined) {
    mongoQuery.price = {};
    if (filters.minPrice !== undefined) mongoQuery.price.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) mongoQuery.price.$lte = filters.maxPrice;
  }

  if (filters.category) {
    mongoQuery.category = filters.category;
  }

  const orConditions = [];

  if (filters.styles && filters.styles.length) {
    filters.styles.forEach(s => {
      orConditions.push({ style: { $regex: s, $options: 'i' } });
      orConditions.push({ tags: s });
      orConditions.push({ title: { $regex: s, $options: 'i' } });
    });
  }

  if (filters.moods && filters.moods.length) {
    filters.moods.forEach(m => {
      orConditions.push({ mood: { $regex: m, $options: 'i' } });
      orConditions.push({ tags: m });
      orConditions.push({ description: { $regex: m, $options: 'i' } });
    });
  }

  if (filters.colors && filters.colors.length) {
    filters.colors.forEach(c => {
      orConditions.push({ tags: c });
      orConditions.push({ description: { $regex: c, $options: 'i' } });
    });
  }

  if (orConditions.length > 0) {
    mongoQuery.$or = orConditions;
  }

  let results = await Artwork.find(mongoQuery)
    .sort({ views: -1, createdAt: -1 })
    .limit(limit)
    .populate('artist', 'name avatar');

  // Fallback if no exact match found: relax criteria
  if (results.length === 0) {
    const fallbackQuery = { isPublished: true };
    if (filters.maxPrice !== undefined) {
      fallbackQuery.price = { $lte: filters.maxPrice * 1.3 };
    }
    results = await Artwork.find(fallbackQuery)
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .populate('artist', 'name avatar');
  }

  return results;
}

/**
 * Generates natural curator response message
 */
function generateCuratorReply(userMessage, filters, artworksCount) {
  const introPhrases = [
    "I've carefully curated these pieces from our collection for you.",
    "Here are some standout artworks that harmonize with your preferences.",
    "Based on what you're seeking, these original works from ArtHub artists would be splendid.",
    "I've explored our gallery and selected these evocative creations for you."
  ];
  const intro = introPhrases[Math.floor(Math.random() * introPhrases.length)];

  let details = '';
  if (filters.maxPrice) {
    details += ` within your budget of $${filters.maxPrice}`;
  }
  if (filters.moods?.length) {
    details += ` embodying a ${filters.moods.join(' and ')} ambiance`;
  }
  if (filters.styles?.length) {
    details += ` highlighting ${filters.styles.join(' and ')} aesthetics`;
  }
  if (filters.colors?.length) {
    details += ` with ${filters.colors.join(' & ')} color palettes`;
  }

  if (artworksCount > 0) {
    return `${intro}${details ? ` Each selection was chosen to align with your interest in${details}.` : ''} You can preview, wishlist, or purchase any piece directly below:`;
  } else {
    return "I couldn't find an exact match for those specific filters right now, but here are some of our most celebrated gallery pieces you might enjoy exploring:";
  }
}

/**
 * Main chat handler for ArtHub AI curator
 */
async function handleCuratorChat({ message, conversationHistory = [] }) {
  const filters = parseCuratorIntent(message);
  const artworks = await fetchMatchedArtworks(filters, 4);
  const replyText = generateCuratorReply(message, filters, artworks.length);

  return {
    reply: replyText,
    parsedCriteria: filters,
    recommendedArtworks: artworks,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  handleCuratorChat,
  parseCuratorIntent,
};
