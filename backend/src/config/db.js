const mongoose = require('mongoose');
const dns = require('dns');

// Fix Fly.io SRV DNS resolution failures by using Google and Cloudflare public DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);
} catch (e) {
  console.warn('⚠️ Could not set custom DNS servers:', e.message);
}

// Convert mongodb+srv:// to direct shard seedlist to bypass flaky SRV DNS resolution on Fly.io
const getDirectMongoUri = (srvUri) => {
  if (!srvUri || !srvUri.startsWith('mongodb+srv://')) return srvUri;
  const match = srvUri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/);
  if (!match) return srvUri;

  const [, user, pass, host, db = 'shayors_cosmetics', query = ''] = match;
  if (host.includes('cluster0.0mvawjo.mongodb.net')) {
    const shards = [
      'ac-wjk1wvx-shard-00-00.0mvawjo.mongodb.net:27017',
      'ac-wjk1wvx-shard-00-01.0mvawjo.mongodb.net:27017',
      'ac-wjk1wvx-shard-00-02.0mvawjo.mongodb.net:27017'
    ].join(',');
    const cleanDb = db || 'shayors_cosmetics';
    return `mongodb://${user}:${pass}@${shards}/${cleanDb}?ssl=true&replicaSet=atlas-ohhh9v-shard-0&authSource=admin${query ? '&' + query : ''}`;
  }
  return srvUri;
};

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

  const connectOptions = {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 15000,
    family: 4 // Force IPv4
  };

  connectionAttempt = (async () => {
    try {
      // First attempt: Primary URI (with public DNS configured)
      await mongoose.connect(process.env.MONGO_URI, connectOptions);
      lastError = null;
      reconnectDelay = 5000;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      console.log(`✅ Atlas: Connected to ${mongoose.connection.host}`);
    } catch (primaryErr) {
      console.warn(`⚠️ Atlas primary connection failed: ${primaryErr.message}`);

      // If SRV DNS failed (ESERVFAIL / querySrv), immediately try the direct shard replica-set seedlist
      if (primaryErr.message.includes('querySrv') || primaryErr.message.includes('ESERVFAIL') || primaryErr.message.includes('ENOTFOUND')) {
        const directUri = getDirectMongoUri(process.env.MONGO_URI);
        if (directUri && directUri !== process.env.MONGO_URI) {
          console.log('⚡ Atlas: Attempting direct shard seedlist fallback (bypassing SRV DNS)...');
          try {
            await mongoose.connect(directUri, connectOptions);
            lastError = null;
            reconnectDelay = 5000;
            if (reconnectTimer) {
              clearTimeout(reconnectTimer);
              reconnectTimer = null;
            }
            console.log(`✅ Atlas: Connected via direct shard seedlist to ${mongoose.connection.host}`);
            return;
          } catch (fallbackErr) {
            console.error(`❌ Atlas: Direct shard fallback also failed: ${fallbackErr.message}`);
            lastError = fallbackErr.message;
            scheduleReconnect();
            throw fallbackErr;
          }
        }
      }

      lastError = primaryErr.message;
      scheduleReconnect();
      throw primaryErr;
    } finally {
      connectionAttempt = null;
    }
  })();

  return connectionAttempt;
};

const getLastError = () => lastError;

module.exports = { connectDB, getLastError };
