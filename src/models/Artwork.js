const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    required: true,
    enum: ['Painting', 'Digital', 'Sculpture', 'Photography', 'Illustration', 'Mixed Media', 'Other'],
  },
  subcategory: { type: String, trim: true, default: '' },
  image: { type: String, required: true },
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  artistName: { type: String, required: true },
  isPublished: { type: Boolean, default: true },
  isSold: { type: Boolean, default: false },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  featured: { type: Boolean, default: false },

  // AI & Discovery metadata
  tags: [{ type: String, trim: true, lowercase: true }],
  style: { type: String, trim: true, default: 'Contemporary' },
  mood: { type: String, trim: true, default: 'Inspiring' },
  colorPalette: [{ type: String, trim: true }],
  altText: { type: String, trim: true, default: '' },
  views: { type: Number, default: 0 },
  visualEmbedding: [{ type: Number }], // 8-dim normalized visual feature vector
  aiGenerated: {
    isAiAssisted: { type: Boolean, default: false },
    suggestedKeywords: [{ type: String }],
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
  },
}, { timestamps: true });

artworkSchema.index({ title: 'text', artistName: 'text', tags: 'text', description: 'text' });
artworkSchema.index({ category: 1, isPublished: 1, price: 1 });
artworkSchema.index({ tags: 1, isPublished: 1 });
artworkSchema.index({ style: 1, isPublished: 1 });
artworkSchema.index({ mood: 1, isPublished: 1 });
artworkSchema.index({ price: 1 });
artworkSchema.index({ views: -1 });
artworkSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Artwork', artworkSchema);
