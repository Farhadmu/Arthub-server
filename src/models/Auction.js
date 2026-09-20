const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bidderName: {
    type: String,
    required: true,
  },
  bidderAvatar: {
    type: String,
    default: '',
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  placedAt: {
    type: Date,
    default: Date.now,
  },
});

const auctionSchema = new mongoose.Schema({
  artwork: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork',
    required: true,
  },
  artworkTitle: {
    type: String,
    required: true,
  },
  artworkImage: {
    type: String,
    required: true,
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  artistName: {
    type: String,
    required: true,
  },
  startingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  currentBid: {
    type: Number,
    default: function () {
      return this.startingPrice;
    },
  },
  minIncrement: {
    type: Number,
    default: 25,
  },
  reservePrice: {
    type: Number,
    default: 0,
  },
  reserveMet: {
    type: Boolean,
    default: false,
  },
  highestBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  highestBidderName: {
    type: String,
  },
  bids: [bidSchema],
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['UPCOMING', 'ACTIVE', 'ENDED', 'SETTLED', 'CANCELLED'],
    default: 'ACTIVE',
  },
  antiSnipeMinutes: {
    type: Number,
    default: 2, // Extend by 2 mins if bid placed in last 2 mins
  },
  curatorNotes: {
    type: String,
    default: 'Featured Live Fine Art Auction curated by ArtHub',
  },
}, { timestamps: true });

auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ status: 1, currentBid: -1 });
auctionSchema.index({ highestBidder: 1 });
auctionSchema.index({ artwork: 1 });
auctionSchema.index({ artist: 1 });

module.exports = mongoose.model('Auction', auctionSchema);
