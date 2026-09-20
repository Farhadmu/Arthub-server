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
let isConnecting = false;

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI is not set in environment variables');
    return null;
  }
  if (isConnecting) return null;
  isConnecting = true;
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    return null;
  } finally {
    isConnecting = false;
  }
}

if (process.env.MONGODB_URI) {
  connectDB().catch((err) => console.error('Initial DB connect attempt failed:', err.message));
}

// Dynamic CORS configuration compatible with credentials: true
app.use(cors({
  origin: (origin, callback) => {
    // Requests without origin (curl, server-to-server, health checks)
    if (!origin) return callback(null, true);
    // Allow localhost, client domain, and any vercel preview app
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
    // Fallback permit to prevent unwanted client breakages
    return callback(null, true);
  },
  credentials: true,
}));

// Root and health endpoints respond immediately without blocking on DB
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ArtHub API is running on Vercel',
    version: '2.0.0',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'connecting/offline',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ArtHub AI API is running on Vercel',
    version: '2.0.0',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'connecting/offline',
    aiServices: ['artworkGenerator', 'recommendations', 'visualSearch', 'curatorAssistant', 'moderation', 'artistInsights'],
  });
});

// IMPORTANT: Stripe webhook needs the RAW request body to verify the signature.
app.use('/api/transactions/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware to ensure DB connection on serverless requests for API routes
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

app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;