const mongoose = require('mongoose');

// Store the last connection error to show in health checks
let lastError = null;
let reconnectTimer = null;
let reconnectDelay = 5000;
let connectionAttempt = null;

const scheduleReconnect = () => {
  if (reconnectTimer || !process.env.MONGO_URI) return;

  const delay = reconnectDelay;
  reconnectDelay = Math.min(reconnectDelay * 2, 60000);
  console.log(`🔄 Retrying database connection in ${delay / 1000} seconds...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectDB().catch((error) => {
      console.error(`Automatic database reconnect failed: ${error.message}`);
    });
  }, delay);
};

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    lastError = 'MONGO_URI is missing';
    console.error(`CRITICAL: ${lastError}`);
    throw new Error(lastError);
  }

  if (mongoose.connection.readyState === 1) return;
  if (connectionAttempt) return connectionAttempt;

  console.log('📡 Atlas: Connecting...');
  connectionAttempt = mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    family: 4 // Force IPv4 to avoid Fly.io DNS resolution bugs
  }).then(() => {
    lastError = null;
    reconnectDelay = 5000;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    console.log(`✅ Atlas: Connected to ${mongoose.connection.host}`);
  }).catch((error) => {
    lastError = error.message;
    console.error(`❌ Atlas: Error - ${error.message}`);
    scheduleReconnect();
    throw error;
  }).finally(() => {
    connectionAttempt = null;
  });

  return connectionAttempt;
};

const getLastError = () => lastError;

module.exports = { connectDB, getLastError };
