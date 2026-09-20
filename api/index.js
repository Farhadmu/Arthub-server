require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { errorHandler, notFound } = require('../src/middleware/errorHandler');

const authRoutes = require('../src/routes/auth');
const artworkRoutes = require('../src/routes/artworks');
const transactionRoutes = require('../src/routes/transactions');
const commentRoutes = require('../src/routes/comments');
const userRoutes = require('../src/routes/users');
const wishlistRoutes = require('../src/routes/wishlist');
const aiRoutes = require('../src/routes/ai');
const notificationRoutes = require('../src/routes/notifications');
const uploadRoutes = require('../src/routes/upload');
const certificateRoutes = require('../src/routes/certificates');
const auctionRoutes = require('../src/routes/auctions');

const app = express();

let cachedPromise = null;
let lastDbError = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!process.env.MONGODB_URI) {
    lastDbError = 'MONGODB_URI is not set';
    console.warn('MONGODB_URI is not set in environment variables');
    return null;
  }
  if (!cachedPromise) {
    cachedPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    }).then((conn) => {
      lastDbError = null;
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    }).catch((err) => {
      console.error(`Database connection error: ${err.message}`);
      lastDbError = err.message;
      cachedPromise = null;
      return null;
    });
  }
  return cachedPromise;
}

// Dynamic CORS configuration compatible with credentials: true
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter(Boolean);

    if (
      allowed.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// IMPORTANT: Stripe webhook needs the RAW request body to verify the signature.
app.use('/api/transactions/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware to ensure DB connection on serverless requests for all routes
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1 && process.env.MONGODB_URI) {
    try {
      await connectDB();
    } catch (err) {
      console.warn('DB connect on request failed:', err.message);
    }
  }
  next();
});

// Root and health endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ArtHub API is running on Vercel',
    version: '2.0.3',
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : (mongoose.connection.readyState === 2 ? 'connecting' : 'disconnected'),
    lastDbError: lastDbError,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ArtHub AI API is running on Vercel',
    version: '2.0.3',
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : (mongoose.connection.readyState === 2 ? 'connecting' : 'disconnected'),
    lastDbError: lastDbError,
    aiServices: ['artworkGenerator', 'recommendations', 'visualSearch', 'curatorAssistant', 'moderation', 'artistInsights'],
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/auctions', auctionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;