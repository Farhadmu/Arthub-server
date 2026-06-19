require('dotenv').config();
const express = require('express');
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

const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', globalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wishlist', wishlistRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ArtHub API is running' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;