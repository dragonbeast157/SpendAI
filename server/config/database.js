const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Database: Attempting to connect to MongoDB...');
    console.log('Database: DATABASE_URL from env:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    const connectionString = process.env.DATABASE_URL || 'mongodb://localhost:27017/SpendAI';
    console.log('Database: Using connection string:', connectionString.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    const conn = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    console.log('Database: MongoDB Connected successfully');
    console.log('Database: Connected to host:', conn.connection.host);
    console.log('Database: Connected to database:', conn.connection.name);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('Database: MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Database: MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('Database: MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error('Database: MongoDB connection failed:', error.message);
    console.error('Database: Full error:', error);
    
    // Exit the process if database connection fails
    console.error('Database: Exiting process due to database connection failure');
    process.exit(1);
  }
};

module.exports = { connectDB };