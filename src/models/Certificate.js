const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  artwork: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork',
    required: true,
  },
  artworkTitle: {
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
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  buyerName: {
    type: String,
    required: true,
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  },
  editionNumber: {
    type: String,
    default: '1/1 Original',
  },
  medium: {
    type: String,
    default: 'Digital Fine Art',
  },
  dimensions: {
    type: String,
    default: 'Variable / 300 DPI High-Res Master',
  },
  verificationHash: {
    type: String,
    required: true,
    unique: true,
  },
  qrCodeUrl: {
    type: String,
  },
  metadata: {
    colorPalette: [String],
    style: String,
    yearCreated: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    provenanceTrail: [
      {
        event: String,
        party: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  status: {
    type: String,
    enum: ['VALID', 'REVOKED', 'TRANSFERRED'],
    default: 'VALID',
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

certificateSchema.index({ verificationHash: 1 }, { unique: true });
certificateSchema.index({ buyer: 1, createdAt: -1 });
certificateSchema.index({ artwork: 1, buyer: 1 });
certificateSchema.index({ artist: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
