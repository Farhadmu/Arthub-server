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
      console.log('Email: admin@arthub.com');
      console.log('Password: Admin@123');
      await mongoose.disconnect();
      return;
    }

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
    console.log('Email: admin@arthub.com');
    console.log('Password: Admin@123');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedAdmin();