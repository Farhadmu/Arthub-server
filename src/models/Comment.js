const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, default: '' },
  comment: { type: String, required: true, trim: true, maxlength: 1000 },
  status: {
    type: String,
    enum: ['SAFE', 'REVIEW', 'BLOCKED'],
    default: 'SAFE',
    index: true,
  },
  moderationReason: { type: String, default: '' },
  moderationScore: { type: Number, default: 0 },
  flaggedByAi: { type: Boolean, default: false },
  reviewedByAdmin: { type: Boolean, default: false },
}, { timestamps: true });

commentSchema.index({ artwork: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
