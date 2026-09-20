const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const Transaction = require('../models/Transaction');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');
const { sendPurchaseEmail, sendSubscriptionEmail } = require('../utils/emailService');

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
      return res.status(400).json({ message: 'Free tier limit reached (3 purchases max). Upgrade to Pro or Premium.' });
    }
    if (user.subscriptionTier === 'pro' && user.purchaseCount >= 9) {
      return res.status(400).json({ message: 'Pro tier limit reached (9 purchases max). Upgrade to Premium.' });
    }

    // If Stripe secret key is present, create real session
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
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
        success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/user?success=true`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/artworks/${artworkId}?cancelled=true`,
        metadata: {
          artworkId: artworkId.toString(),
          buyerId: req.user._id.toString(),
          artistId: artwork.artist.toString(),
          type: 'purchase',
        }
      });
      return res.json({ url: session.url });
    }

    // Seamless development mode fallback (direct fulfillment simulation)
    artwork.isSold = true;
    artwork.buyer = req.user._id;
    await artwork.save();

    user.purchaseCount += 1;
    await user.save();

    const simulatedSessionId = 'sim_' + Date.now();
    await Transaction.create({
      type: 'purchase',
      user: req.user._id,
      userEmail: user.email,
      artwork: artwork._id,
      artworkTitle: artwork.title,
      artist: artwork.artist,
      artistEmail: artwork.artistName,
      amount: artwork.price,
      currency: 'usd',
      stripeSessionId: simulatedSessionId,
      status: 'completed',
    });

    // In-app notifications
    await Promise.all([
      Notification.create({
        recipient: req.user._id,
        type: 'PURCHASE_SUCCESS',
        title: 'Artwork Purchase Confirmed! 🎨',
        message: `You are now the proud owner of "${artwork.title}".`,
        link: `/artworks/${artwork._id}`,
      }).catch(() => {}),
      Notification.create({
        recipient: artwork.artist,
        sender: req.user._id,
        type: 'ARTWORK_SOLD',
        title: 'Artwork Sold! 💰',
        message: `Your piece "${artwork.title}" was purchased for $${artwork.price}.`,
        link: `/dashboard/artist`,
      }).catch(() => {}),
    ]);

    sendPurchaseEmail({
      buyerEmail: user.email,
      buyerName: user.name,
      artistEmail: '',
      artistName: artwork.artistName,
      artworkTitle: artwork.title,
      amount: artwork.price,
    });

    res.json({
      url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/user?success=true`,
      simulated: true,
    });
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

    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
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
        success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/user?subscription=success`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/user?subscription=cancelled`,
        metadata: {
          userId: req.user._id.toString(),
          tier,
          type: 'subscription',
        }
      });
      return res.json({ url: session.url });
    }

    // Dev fallback
    const user = await User.findById(req.user._id);
    if (user) {
      user.subscriptionTier = tier;
      user.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await user.save();
    }

    const simulatedSessionId = 'sub_' + Date.now();
    await Transaction.create({
      type: 'subscription',
      user: req.user._id,
      userEmail: user?.email,
      amount: prices[tier] / 100,
      subscriptionTier: tier,
      stripeSessionId: simulatedSessionId,
      status: 'completed',
    });

    await Notification.create({
      recipient: req.user._id,
      type: 'SUBSCRIPTION_UPDATE',
      title: `Subscribed to ArtHub ${tier.toUpperCase()} ⭐`,
      message: `Your account has been successfully upgraded to ${tier}.`,
      link: `/dashboard/user`,
    }).catch(() => {});

    sendSubscriptionEmail({
      userEmail: user?.email,
      userName: user?.name,
      tier,
      amount: prices[tier] / 100,
    });

    res.json({
      url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/user?subscription=success`,
      simulated: true,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Stripe webhook (idempotent signature-verified handler)
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

    // Idempotency check: prevent duplicate event processing
    const existingTransaction = await Transaction.findOne({ stripeSessionId: session.id });
    if (existingTransaction) {
      return res.json({ received: true, notice: 'Already processed' });
    }

    const { artworkId, buyerId, artistId, type, tier, userId } = session.metadata;

    if (type === 'purchase') {
      const [artwork, buyer, artist] = await Promise.all([
        Artwork.findById(artworkId),
        User.findById(buyerId),
        User.findById(artistId),
      ]);

      if (artwork) {
        artwork.isSold = true;
        artwork.buyer = buyerId;
        await artwork.save();
      }

      if (buyer) {
        buyer.purchaseCount += 1;
        await buyer.save();
      }

      const amountPaid = session.amount_total / 100;
      await Transaction.create({
        type: 'purchase',
        user: buyerId,
        userEmail: buyer?.email,
        artwork: artworkId,
        artworkTitle: artwork?.title,
        artist: artistId,
        artistEmail: artist?.email,
        amount: amountPaid,
        currency: 'usd',
        stripeSessionId: session.id,
        status: 'completed',
      });

      // In-app notifications
      await Promise.all([
        Notification.create({
          recipient: buyerId,
          type: 'PURCHASE_SUCCESS',
          title: 'Artwork Purchase Confirmed! 🎨',
          message: `You now own "${artwork?.title}". Thank you for supporting artists!`,
          link: `/artworks/${artworkId}`,
        }).catch(() => {}),
        Notification.create({
          recipient: artistId,
          sender: buyerId,
          type: 'ARTWORK_SOLD',
          title: 'Artwork Sold! 💰',
          message: `Your artwork "${artwork?.title}" just sold for $${amountPaid}!`,
          link: `/dashboard/artist`,
        }).catch(() => {}),
      ]);

      sendPurchaseEmail({
        buyerEmail: buyer?.email,
        buyerName: buyer?.name,
        artistEmail: artist?.email,
        artistName: artist?.name,
        artworkTitle: artwork?.title,
        amount: amountPaid,
      });
    } else if (type === 'subscription') {
      const user = await User.findById(userId);
      if (user) {
        user.subscriptionTier = tier;
        user.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await user.save();
      }

      const amountPaid = session.amount_total / 100;
      await Transaction.create({
        type: 'subscription',
        user: userId,
        userEmail: user?.email,
        amount: amountPaid,
        subscriptionTier: tier,
        stripeSessionId: session.id,
        status: 'completed',
      });

      await Notification.create({
        recipient: userId,
        type: 'SUBSCRIPTION_UPDATE',
        title: `Welcome to ArtHub ${tier.toUpperCase()}! ⭐`,
        message: `Your monthly subscription is active. Enjoy your expanded collecting limits!`,
        link: `/dashboard/user`,
      }).catch(() => {});

      sendSubscriptionEmail({
        userEmail: user?.email,
        userName: user?.name,
        tier,
        amount: amountPaid,
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
      .populate('artwork', 'title image price category artistName');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get artist's sales history
router.get('/artist/sales', auth, authorize('artist'), async (req, res) => {
  try {
    const transactions = await Transaction.find({ artist: req.user._id, type: 'purchase' })
      .sort({ createdAt: -1 })
      .populate('artwork', 'title image price')
      .populate('user', 'name email avatar');
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
      .populate('artwork', 'title image')
      .populate('artist', 'name email');
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
      monthlySales,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
