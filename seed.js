require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
    
    const usersCollection = mongoose.connection.db.collection('users');
    const existingAdmin = await usersCollection.findOne({ email: 'admin@arthub.com' });
    
    if (existingAdmin) {
      console.log('Admin already exists');
    } else {
      const hashedPassword = await bcrypt.hash('Admin@123', 12);
      await usersCollection.insertOne({
        name: 'Admin',
        email: 'admin@arthub.com',
        password: hashedPassword,
        role: 'admin',
        avatar: '',
        subscriptionTier: 'free',
        wishlist: [],
        purchaseCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Admin created successfully!');
    }
    console.log('Email: admin@arthub.com');
    console.log('Password: Admin@123');

    // Seed Auction if none exists
    const auctionsCollection = mongoose.connection.db.collection('auctions');
    const existingAuction = await auctionsCollection.findOne({});
    const artworksCollection = mongoose.connection.db.collection('artworks');
    const sampleArtwork = await artworksCollection.findOne({});

    if (!existingAuction && sampleArtwork) {
      await auctionsCollection.insertOne({
        artwork: sampleArtwork._id,
        artworkTitle: sampleArtwork.title,
        artworkImage: sampleArtwork.image,
        artist: sampleArtwork.artist,
        artistName: sampleArtwork.artistName,
        startingPrice: 350,
        currentBid: 480,
        minIncrement: 25,
        reservePrice: 500,
        reserveMet: false,
        startTime: new Date(),
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        status: 'ACTIVE',
        curatorNotes: 'Exquisite Curated Auction piece featured by ArtHub Global Salon.',
        bids: [
          {
            bidder: sampleArtwork.artist,
            bidderName: 'Alexander Vance',
            amount: 480,
            placedAt: new Date(Date.now() - 15 * 60 * 1000),
          },
          {
            bidder: sampleArtwork.artist,
            bidderName: 'Sophia Sterling',
            amount: 420,
            placedAt: new Date(Date.now() - 60 * 60 * 1000),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Sample Live Auction seeded successfully!');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedAdmin();