import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/management_db');
    console.log('MongoDB Connected for seeding...');

    // Check if SUPER_ADMIN exists
    const adminExists = await User.findOne({ role: 'SUPER_ADMIN' });

    if (adminExists) {
      console.log('SUPER_ADMIN already exists. Skipping seed.');
    } else {
      // Create SUPER_ADMIN
      const admin = new User({
        name: process.env.SEED_ADMIN_NAME || 'Super Admin',
        email: process.env.SEED_ADMIN_EMAIL || 'admin@admin.com',
        password: process.env.SEED_ADMIN_PASSWORD || (() => {
          throw new Error('SEED_ADMIN_PASSWORD must be set in .env');
        })(),
        role: 'SUPER_ADMIN'
      });

      await admin.save();
      console.log('✅ SUPER_ADMIN created successfully!');
      console.log(`📧 Email: ${admin.email}`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred during seeding.');
    }
    process.exit(1);
  }
};

seedData();
