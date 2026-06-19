const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  googleId: { type: String },
  role: { type: String, enum: ['user', 'artist', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
  subscriptionTier: { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
  subscriptionExpiry: { type: Date },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' }],
  purchaseCount: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);