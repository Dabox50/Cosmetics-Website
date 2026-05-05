const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('CRITICAL: MONGO_URI is missing');
      return;
    }

    console.log('📡 Atlas: Connecting...');
    
    // Simplest possible connection to avoid handshake bugs
    await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ Atlas: Connected to ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`❌ Atlas: Error - ${error.message}`);
    // Keep server up so user can see 503 instead of 500
  }
};

module.exports = connectDB;
