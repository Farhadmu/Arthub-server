const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Transaction = require('../models/Transaction');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Create checkout session for artwork purchase
router.post('/create-purchase-session', auth, async (req, res) => {
  try {
    const { artworkId } = req.body;
    const artwork = await Artwork.findById(artworkId);

    if (!artwork || !artwork.isPublished || artwork.isSold) {
      return res.status(400).json({ message: 'Artwork not available for purchase' });
    }

    if (artwork.artist.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot purchase your own artwork' });
    }

    // Check subscription limits
    const user = await User.findById(req.user._id);
    if (user.subscriptionTier === 'free' && user.purchaseCount >= 3) {
      return res.status(400).json({ message: 'Free tier limit reached. Upgrade to Pro or Premium.' });
    }
    if (user.subscriptionTier === 'pro' && user.purchaseCount >= 9) {
      return res.status(400).json({ message: 'Pro tier limit reached. Upgrade to Premium.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: artwork.title, images: [artwork.image] },
          unit_amount: Math.round(artwork.price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/dashboard/user?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/artworks/${artworkId}?cancelled=true`,
      metadata: {
        artworkId: artworkId.toString(),
        buyerId: req.user._id.toString(),
        artistId: artwork.artist.toString(),
        type: 'purchase'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create checkout session for subscription
router.post('/create-subscription-session', auth, async (req, res) => {
  try {
    const { tier } = req.body;
    const prices = { pro: 999, premium: 1999 };

    if (!prices[tier]) {
      return res.status(400).json({ message: 'Invalid subscription tier' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `ArtHub ${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription` },
          unit_amount: prices[tier],
          recurring: { interval: 'month' }
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/dashboard/user?subscription=success`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard/user?subscription=cancelled`,
      metadata: {
        userId: req.user._id.toString(),
        tier,
        type: 'subscription'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Stripe webhook (raw body parsing is applied globally in index.js before express.json())
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { artworkId, buyerId, artistId, type, tier, userId } = session.metadata;

    if (type === 'purchase') {
      const artwork = await Artwork.findById(artworkId);
      const buyer = await User.findById(buyerId);
      const artist = await User.findById(artistId);

      if (artwork) {
        artwork.isSold = true;
        artwork.buyer = buyerId;
        artwork.isPublished = false;
        await artwork.save();
      }

      if (buyer) {
        buyer.purchaseCount += 1;
        await buyer.save();
      }

      await Transaction.create({
        type: 'purchase',
        user: buyerId,
        userEmail: buyer?.email,
        artwork: artworkId,
        artworkTitle: artwork?.title,
        artist: artistId,
        artistEmail: artist?.email,
        amount: session.amount_total / 100,
        stripeSessionId: session.id
      });
    } else if (type === 'subscription') {
      const user = await User.findById(userId);
      if (user) {
        user.subscriptionTier = tier;
        user.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await user.save();
      }

      await Transaction.create({
        type: 'subscription',
        user: userId,
        userEmail: user?.email,
        amount: session.amount_total / 100,
        subscriptionTier: tier,
        stripeSessionId: session.id
      });
    }
  }

  res.json({ received: true });
});

// Get user's purchase history
router.get('/user/purchases', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id, type: 'purchase' })
      .sort({ createdAt: -1 })
      .populate('artwork', 'title image price');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get artist's sales history
router.get('/artist/sales', auth, authorize('artist'), async (req, res) => {
  try {
    const transactions = await Transaction.find({ artist: req.user._id, type: 'purchase' })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all transactions (admin)
router.get('/all', auth, authorize('admin'), async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('artwork', 'title');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get analytics (admin)
router.get('/analytics', auth, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalArtists = await User.countDocuments({ role: 'artist' });
    const totalArtworksSold = await Transaction.countDocuments({ type: 'purchase' });
    const revenueResult = await Transaction.aggregate([
      { $match: { type: 'purchase' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const salesByCategory = await Artwork.aggregate([
      { $match: { isSold: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const monthlySales = await Transaction.aggregate([
      { $match: { type: 'purchase' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    res.json({
      totalUsers,
      totalArtists,
      totalArtworksSold,
      totalRevenue,
      salesByCategory,
      monthlySales
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
