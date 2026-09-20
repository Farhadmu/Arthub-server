const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction');
const Artwork = require('../models/Artwork');
const { auth } = require('../middleware/auth');

// Get all active / upcoming auctions
router.get('/', async (req, res) => {
  try {
    const { status = 'ACTIVE' } = req.query;
    const query = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const auctions = await Auction.find(query)
      .populate('artwork', 'title image price category style')
      .populate('artist', 'name avatar')
      .populate('highestBidder', 'name avatar')
      .sort({ endTime: 1 });

    res.json(auctions);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch auctions' });
  }
});

// Get spotlight auction for Home Page banner / live arena widget
router.get('/spotlight', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    let auction = await Auction.findOne({ status: 'ACTIVE' })
      .populate('artwork', 'title image price category style colorPalette description')
      .populate('artist', 'name avatar')
      .populate('highestBidder', 'name avatar')
      .sort({ currentBid: -1, endTime: 1 });

    if (!auction) {
      auction = await Auction.findOne()
        .populate('artwork', 'title image price category style colorPalette description')
        .populate('artist', 'name avatar')
        .populate('highestBidder', 'name avatar')
        .sort({ createdAt: -1 });
    }

    if (!auction) {
      return res.status(404).json({ message: 'No active spotlight auction available' });
    }

    res.json(auction);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch spotlight auction' });
  }
});

// Get single auction by ID
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('artwork')
      .populate('artist', 'name avatar')
      .populate('highestBidder', 'name avatar')
      .populate('bids.bidder', 'name avatar');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Auto-update status if endTime passed
    if (auction.status === 'ACTIVE' && new Date() > new Date(auction.endTime)) {
      auction.status = 'ENDED';
      await auction.save();
    }

    res.json(auction);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch auction details' });
  }
});

// Create new auction (Artist or Admin)
router.post('/', auth, async (req, res) => {
  try {
    const {
      artworkId,
      startingPrice,
      minIncrement = 25,
      reservePrice = 0,
      durationHours = 48,
      curatorNotes,
    } = req.body;

    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    const startTime = new Date();
    const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    const auction = new Auction({
      artwork: artwork._id,
      artworkTitle: artwork.title,
      artworkImage: artwork.image,
      artist: artwork.artist,
      artistName: artwork.artistName,
      startingPrice: Number(startingPrice) || artwork.price,
      currentBid: Number(startingPrice) || artwork.price,
      minIncrement: Number(minIncrement) || 25,
      reservePrice: Number(reservePrice) || 0,
      startTime,
      endTime,
      status: 'ACTIVE',
      curatorNotes: curatorNotes || 'Curated Live Auction on ArtHub',
    });

    await auction.save();
    res.status(201).json(auction);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Auction creation failed' });
  }
});

const { bidLimiter } = require('../middleware/rateLimiter');

// Place a bid
router.post('/:id/bid', auth, bidLimiter, async (req, res) => {
  try {
    const { amount } = req.body;
    const parsed = Number(amount);

    if (!parsed || isNaN(parsed) || !isFinite(parsed) || parsed <= 0 || parsed > 10000000) {
      return res.status(400).json({ message: 'A valid positive bid amount between $1 and $10,000,000 is required' });
    }

    // Round to 2 decimal places to prevent float precision exploit
    const bidAmount = Math.round(parsed * 100) / 100;

    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.status !== 'ACTIVE' || new Date() > new Date(auction.endTime)) {
      auction.status = 'ENDED';
      await auction.save();
      return res.status(400).json({ message: 'This auction has concluded' });
    }

    const minRequiredBid = auction.bids.length === 0
      ? auction.startingPrice
      : auction.currentBid + auction.minIncrement;

    if (bidAmount < minRequiredBid) {
      return res.status(400).json({
        message: `Bid must be at least $${minRequiredBid.toLocaleString()} (minimum increment of $${auction.minIncrement})`,
        minRequiredBid,
      });
    }

    // Anti-sniping extension: if bid in final 2 minutes, extend by 2 minutes
    const now = Date.now();
    const remainingMs = new Date(auction.endTime).getTime() - now;
    const antiSnipeMs = (auction.antiSnipeMinutes || 2) * 60 * 1000;

    let extended = false;
    if (remainingMs < antiSnipeMs) {
      auction.endTime = new Date(now + antiSnipeMs);
      extended = true;
    }

    // Record bid
    auction.bids.unshift({
      bidder: req.user._id,
      bidderName: req.user.name,
      bidderAvatar: req.user.avatar || '',
      amount: bidAmount,
      placedAt: new Date(),
    });

    auction.currentBid = bidAmount;
    auction.highestBidder = req.user._id;
    auction.highestBidderName = req.user.name;

    if (auction.reservePrice > 0 && bidAmount >= auction.reservePrice) {
      auction.reserveMet = true;
    }

    await auction.save();

    res.json({
      message: 'Bid successfully placed!',
      auction,
      extended,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to place bid' });
  }
});

// Settle auction (Finalize winner and mark artwork as sold)
router.post('/:id/settle', auth, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.status === 'SETTLED') {
      return res.status(400).json({ message: 'Auction already settled' });
    }

    auction.status = 'SETTLED';
    await auction.save();

    // Mark artwork as sold
    if (auction.highestBidder) {
      await Artwork.findByIdAndUpdate(auction.artwork, {
        isSold: true,
        buyer: auction.highestBidder,
      });
    }

    res.json({
      message: 'Auction successfully finalized and settled',
      winner: auction.highestBidderName,
      winningBid: auction.currentBid,
      auction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Auction settlement failed' });
  }
});

module.exports = router;
