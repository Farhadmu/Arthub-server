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

const app = express();

let cachedConnection = null;

async function connectDB() {
  if (cachedConnection) {
    return cachedConnection;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    // Do not crash serverless process immediately
    return null;
  }
}

connectDB();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// IMPORTANT: Stripe webhook needs the RAW request body to verify the signature.
// It must be registered BEFORE express.json() so the body isn't parsed as JSON first.
app.use('/api/transactions/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware to ensure DB connection on serverless requests
app.use(async (req, res, next) => {
  if (!cachedConnection && process.env.MONGODB_URI) {
    await connectDB();
  }
  next();
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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ArtHub AI API is running on Vercel',
    version: '2.0.0',
    aiServices: ['artworkGenerator', 'recommendations', 'visualSearch', 'curatorAssistant', 'moderation', 'artistInsights'],
  });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'ArtHub API is running' });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;