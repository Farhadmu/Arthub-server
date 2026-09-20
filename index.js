require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { globalLimiter, authLimiter } = require('./src/middleware/rateLimiter');

const authRoutes = require('./src/routes/auth');
const artworkRoutes = require('./src/routes/artworks');
const transactionRoutes = require('./src/routes/transactions');
const commentRoutes = require('./src/routes/comments');
const userRoutes = require('./src/routes/users');
const wishlistRoutes = require('./src/routes/wishlist');
const aiRoutes = require('./src/routes/ai');
const notificationRoutes = require('./src/routes/notifications');
const uploadRoutes = require('./src/routes/upload');
const certificateRoutes = require('./src/routes/certificates');
const auctionRoutes = require('./src/routes/auctions');

const app = express();

connectDB();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Static uploads directory for images
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// IMPORTANT: Stripe webhook needs the RAW request body to verify the signature.
// It must be registered BEFORE express.json() so the body isn't parsed as JSON first.
app.use('/api/transactions/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', globalLimiter);

// Registered Routes
app.use('/api/auth', authLimiter, authRoutes);
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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ArtHub AI API is running',
    version: '2.0.0',
    aiServices: ['artworkGenerator', 'recommendations', 'visualSearch', 'curatorAssistant', 'moderation', 'artistInsights'],
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
