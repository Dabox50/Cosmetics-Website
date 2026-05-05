const mongoose = require('mongoose');

// Store the last connection error to show in health checks
let lastError = null;

const connectDB = async (retryCount = 5) => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('CRITICAL: MONGO_URI is missing');
      lastError = 'MONGO_URI is missing';
      return;
    }

    console.log(`📡 Atlas: Connecting (Attempts left: ${retryCount})...`);
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, 
      connectTimeoutMS: 10000,
      family: 4 // Force IPv4 to avoid Fly.io DNS resolution bugs
    });

    lastError = null;
    console.log(`✅ Atlas: Connected to ${mongoose.connection.host}`);
  } catch (error) {
    lastError = error.message;
    console.error(`❌ Atlas: Error - ${error.message}`);
    
    if (retryCount > 0) {
      console.log('🔄 Retrying connection in 5 seconds...');
      setTimeout(() => connectDB(retryCount - 1), 5000);
    }
  }
};

const getLastError = () => lastError;

module.exports = { connectDB, getLastError };
