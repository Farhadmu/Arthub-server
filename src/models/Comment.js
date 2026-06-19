const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, default: '' },
  comment: { type: String, required: true, trim: true, maxlength: 500 }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
