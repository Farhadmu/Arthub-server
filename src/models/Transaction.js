const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['purchase', 'subscription'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' },
  artworkTitle: { type: String },
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  artistEmail: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  stripeSessionId: { type: String },
  subscriptionTier: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
