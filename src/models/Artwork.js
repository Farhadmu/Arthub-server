const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, enum: ['Painting', 'Digital', 'Sculpture', 'Photography', 'Illustration', 'Mixed Media', 'Other'] },
  image: { type: String, required: true },
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  artistName: { type: String, required: true },
  isPublished: { type: Boolean, default: true },
  isSold: { type: Boolean, default: false },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

artworkSchema.index({ title: 'text', artistName: 'text' });
artworkSchema.index({ category: 1, isPublished: 1 });
artworkSchema.index({ price: 1 });
artworkSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Artwork', artworkSchema);






