const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use DATABASE_URL from .env file (not MONGODB_URI)
    const mongoURI = process.env.DATABASE_URL;

    if (!mongoURI) {
      console.error('Database connection error: DATABASE_URL is missing from environment variables');
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log('Attempting to connect to MongoDB with URI:', mongoURI);

    // Remove deprecated options that are no longer needed in newer MongoDB driver versions
    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;