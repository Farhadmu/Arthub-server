// recommendationService.js — Multi-tier behavioral & content-based art recommendations
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * Calculates Jaccard similarity or tag overlap score between two arrays
 */
function tagSimilarity(tagsA = [], tagsB = []) {
  if (!tagsA.length || !tagsB.length) return 0;
  const setA = new Set(tagsA.map(t => t.toLowerCase()));
  const setB = new Set(tagsB.map(t => t.toLowerCase()));
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Fetches popular/trending fallback artworks
 */
async function getTrendingArtworks(limit = 8, excludeIds = []) {
  return Artwork.find({
    isPublished: true,
    _id: { $nin: excludeIds }
  })
    .sort({ views: -1, createdAt: -1 })
    .limit(limit)
    .populate('artist', 'name avatar');
}

/**
 * Gets personalized recommendation bundles for a user (or anonymous visitor)
 */
async function getPersonalizedRecommendations({ userId, targetArtworkId, limit = 6 }) {
  try {
    let userPreferences = {
      categories: {},
      styles: {},
      tags: {},
      interactedArtworkIds: new Set(),
      likedArtwork: null
    };

    if (userId) {
      const [user, transactions] = await Promise.all([
        User.findById(userId).populate('wishlist'),
        Transaction.find({ user: userId, type: 'purchase' }).populate('artwork')
      ]);

      // 1. Purchases (weight: 5)
      transactions.forEach(t => {
        if (t.artwork) {
          userPreferences.interactedArtworkIds.add(t.artwork._id.toString());
          if (t.artwork.category) {
            userPreferences.categories[t.artwork.category] = (userPreferences.categories[t.artwork.category] || 0) + 5;
          }
          if (t.artwork.style) {
            userPreferences.styles[t.artwork.style] = (userPreferences.styles[t.artwork.style] || 0) + 5;
          }
          (t.artwork.tags || []).forEach(tag => {
            userPreferences.tags[tag] = (userPreferences.tags[tag] || 0) + 5;
          });
        }
      });

      // 2. Wishlist (weight: 3)
      if (user?.wishlist?.length) {
        user.wishlist.forEach(item => {
          userPreferences.interactedArtworkIds.add(item._id.toString());
          if (!userPreferences.likedArtwork) userPreferences.likedArtwork = item;
          if (item.category) {
            userPreferences.categories[item.category] = (userPreferences.categories[item.category] || 0) + 3;
          }
          if (item.style) {
            userPreferences.styles[item.style] = (userPreferences.styles[item.style] || 0) + 3;
          }
          (item.tags || []).forEach(tag => {
            userPreferences.tags[tag] = (userPreferences.tags[tag] || 0) + 3;
          });
        });
      }
    }

    // Target artwork for "Because You Liked" or "Similar Artworks"
    let anchorArtwork = null;
    if (targetArtworkId) {
      anchorArtwork = await Artwork.findById(targetArtworkId).populate('artist', 'name avatar');
    } else if (userPreferences.likedArtwork) {
      anchorArtwork = userPreferences.likedArtwork;
    }

    // Top preferred categories and styles
    const sortedCategories = Object.keys(userPreferences.categories).sort(
      (a, b) => userPreferences.categories[b] - userPreferences.categories[a]
    );
    const sortedStyles = Object.keys(userPreferences.styles).sort(
      (a, b) => userPreferences.styles[b] - userPreferences.styles[a]
    );

    const excludeArray = Array.from(userPreferences.interactedArtworkIds);

    // Section 1: "Recommended For You"
    let recommendedQuery = { isPublished: true };
    if (excludeArray.length) {
      recommendedQuery._id = { $nin: excludeArray };
    }
    if (sortedCategories.length > 0) {
      recommendedQuery.$or = [
        { category: { $in: sortedCategories.slice(0, 3) } },
        { style: { $in: sortedStyles.slice(0, 3) } }
      ];
    }

    let recommendedForYou = await Artwork.find(recommendedQuery)
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .populate('artist', 'name avatar');

    if (recommendedForYou.length < 4) {
      const fallback = await getTrendingArtworks(
        limit - recommendedForYou.length,
        [...excludeArray, ...recommendedForYou.map(a => a._id.toString())]
      );
      recommendedForYou = [...recommendedForYou, ...fallback];
    }

    // Section 2: "Because You Liked This" / "Similar Artworks"
    let becauseYouLiked = [];
    if (anchorArtwork) {
      becauseYouLiked = await Artwork.find({
        isPublished: true,
        _id: { $ne: anchorArtwork._id },
        $or: [
          { category: anchorArtwork.category },
          { style: anchorArtwork.style },
          { artist: anchorArtwork.artist?._id || anchorArtwork.artist }
        ]
      })
        .sort({ views: -1, createdAt: -1 })
        .limit(limit)
        .populate('artist', 'name avatar');
    }

    if (becauseYouLiked.length === 0) {
      becauseYouLiked = await getTrendingArtworks(limit, recommendedForYou.map(a => a._id.toString()));
    }

    // Section 3: "Trending For You"
    const trending = await Artwork.find({ isPublished: true })
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .populate('artist', 'name avatar');

    // Section 4: "Artists You May Like"
    const topArtistAggregation = await Artwork.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$artist', count: { $sum: 1 }, totalViews: { $sum: '$views' } } },
      { $sort: { totalViews: -1, count: -1 } },
      { $limit: 4 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'artistDetails' } },
      { $unwind: '$artistDetails' },
      {
        $project: {
          _id: 1,
          name: '$artistDetails.name',
          avatar: '$artistDetails.avatar',
          artworkCount: '$count',
          totalViews: 1
        }
      }
    ]);

    return {
      recommendedForYou,
      becauseYouLiked: {
        anchor: anchorArtwork ? {
          _id: anchorArtwork._id,
          title: anchorArtwork.title,
          image: anchorArtwork.image,
          category: anchorArtwork.category,
          style: anchorArtwork.style
        } : null,
        artworks: becauseYouLiked
      },
      trendingForYou: trending,
      artistsYouMayLike: topArtistAggregation
    };
  } catch (error) {
    console.error('Recommendation service error:', error);
    const fallback = await getTrendingArtworks(limit);
    return {
      recommendedForYou: fallback,
      becauseYouLiked: { anchor: null, artworks: fallback.slice(0, 4) },
      trendingForYou: fallback,
      artistsYouMayLike: []
    };
  }
}

module.exports = {
  getPersonalizedRecommendations,
  getTrendingArtworks,
  tagSimilarity
};
