const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('CRITICAL: MONGO_URI is not defined in environment variables');
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB Atlas...');
    
    // Disable buffering so queries fail immediately if not connected
    mongoose.set('bufferCommands', false);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000, // 15 seconds
      socketTimeoutMS: 45000,          // 45 seconds
      connectTimeoutMS: 15000,         // 15 seconds
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('error', err => {
      console.error(`MongoDB Runtime Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB Disconnected. Mongoose will try to reconnect automatically.');
    });

  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('ACTION REQUIRED: Ensure your MongoDB Atlas IP Whitelist includes 0.0.0.0/0 for Fly.io');
    // Don't throw here if we want the server to stay up for health checks, 
    // but the app won't function.
    throw error; 
  }
};

module.exports = connectDB;
