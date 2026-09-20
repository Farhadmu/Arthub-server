const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again in 15 minutes.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Upload limit reached, please try again in an hour.' },
});

const bidLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // max 15 bids per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bidding rate limit exceeded. Please wait a moment before submitting another bid.' },
});

module.exports = { globalLimiter, authLimiter, uploadLimiter, bidLimiter };