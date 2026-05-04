const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('CRITICAL: MONGO_URI is not defined');
      throw new Error('MONGO_URI is not defined');
    }

    console.log('📡 Connecting to MongoDB Atlas...');
    
    // Re-enable buffering so requests wait for connection instead of crashing
    mongoose.set('bufferCommands', true);
    mongoose.set('bufferTimeoutMS', 10000); // Wait max 10s for connection before failing

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    // Do not exit process, let the server stay up for Fly.io health checks
  }
};

module.exports = connectDB;
