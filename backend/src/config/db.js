const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('CRITICAL: MONGO_URI is not defined in environment variables');
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    
    // Set a 10-second timeout for the connection attempt
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,         // 45 seconds
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Log connection events
    mongoose.connection.on('error', err => {
      console.error(`MongoDB Runtime Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB Disconnected. Attempting to reconnect...');
    });

  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Check your MONGO_URI and MongoDB Atlas IP Whitelisting (allow 0.0.0.0/0)');
    throw error; 
  }
};

module.exports = connectDB;
