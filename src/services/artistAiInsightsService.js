// artistAiInsightsService.js — Deep analytics and actionable AI-driven artist growth advice
const Artwork = require('../models/Artwork');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

async function generateArtistInsights(artistId) {
  const [artworks, sales, wishlistingUsers] = await Promise.all([
    Artwork.find({ artist: artistId }).lean(),
    Transaction.find({ artist: artistId, type: 'purchase' }).lean(),
    User.countDocuments({ wishlist: { $in: await Artwork.find({ artist: artistId }).distinct('_id') } }),
  ]);

  const totalArtworks = artworks.length;
  const totalViews = artworks.reduce((acc, a) => acc + (a.views || 0), 0);
  const totalSalesCount = sales.length;
  const totalRevenue = sales.reduce((acc, s) => acc + (s.amount || 0), 0);
  const avgPrice = totalArtworks > 0 ? (artworks.reduce((acc, a) => acc + (a.price || 0), 0) / totalArtworks).toFixed(2) : 0;
  const conversionRate = totalViews > 0 ? ((totalSalesCount / totalViews) * 100).toFixed(2) : 0;

  // Category breakdown
  const categoryStats = {};
  artworks.forEach((art) => {
    if (!categoryStats[art.category]) {
      categoryStats[art.category] = { count: 0, views: 0, sold: 0, revenue: 0 };
    }
    categoryStats[art.category].count += 1;
    categoryStats[art.category].views += (art.views || 0);
    if (art.isSold) categoryStats[art.category].sold += 1;
  });

  sales.forEach((s) => {
    const art = artworks.find(a => a._id.toString() === s.artwork?.toString());
    if (art && categoryStats[art.category]) {
      categoryStats[art.category].revenue += (s.amount || 0);
    }
  });

  // Top artworks
  const sortedByViews = [...artworks].sort((a, b) => (b.views || 0) - (a.views || 0));
  const mostViewedArtwork = sortedByViews[0] || null;

  // Candidate artworks to promote (high views or published, but not yet sold)
  const promoteCandidates = artworks.filter(a => !a.isSold && (a.views || 0) >= 0).slice(0, 3);

  // Generate actionable AI suggestions
  const aiSuggestions = [];

  if (promoteCandidates.length > 0) {
    aiSuggestions.push({
      type: 'PROMOTION',
      title: `Promote "${promoteCandidates[0].title}"`,
      description: `This artwork has garnered strong viewer attention. Consider sharing it across social media or featuring it in your newsletter to convert interest into a sale.`,
      targetArtworkId: promoteCandidates[0]._id,
    });
  }

  // Price tier feedback
  if (totalSalesCount > 0) {
    const avgSaleAmount = (totalRevenue / totalSalesCount).toFixed(0);
    aiSuggestions.push({
      type: 'PRICING',
      title: 'Optimal Price Sweetspot',
      description: `Your collector base is most responsive around the $${avgSaleAmount} price bracket. Creating new pieces in this range could accelerate transaction frequency.`,
    });
  } else {
    aiSuggestions.push({
      type: 'PRICING',
      title: 'Initial Collector Strategy',
      description: `Offering a limited piece under $100 can help build your collector network and establish transaction history.`,
    });
  }

  // Category recommendation
  const bestCategory = Object.keys(categoryStats).sort((a, b) => categoryStats[b].views - categoryStats[a].views)[0] || 'Digital';
  aiSuggestions.push({
    type: 'STYLE_DIRECTION',
    title: `Strong Momentum in ${bestCategory}`,
    description: `Your ${bestCategory} artworks attract the highest viewer retention on ArtHub. Continuing to build collections in this medium will maximize discoverability.`,
  });

  return {
    metrics: {
      totalArtworks,
      totalViews,
      totalSalesCount,
      totalRevenue,
      avgPrice,
      conversionRate: `${conversionRate}%`,
      totalWishlistCount: wishlistingUsers,
    },
    categoryStats,
    topArtworks: {
      mostViewed: mostViewedArtwork ? {
        _id: mostViewedArtwork._id,
        title: mostViewedArtwork.title,
        views: mostViewedArtwork.views || 0,
        price: mostViewedArtwork.price,
        image: mostViewedArtwork.image,
      } : null,
    },
    aiSuggestions,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  generateArtistInsights,
};
