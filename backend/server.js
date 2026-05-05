const dotenv = require('dotenv');
// Load environment variables
dotenv.config();

const { connectDB } = require('./src/config/db');
const app = require('./src/app');

// Connect to Database and start server
const startServer = async () => {
  const PORT = process.env.PORT || 5000;
  
  // Bind to port immediately for Fly.io health checks
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log('App is listening on all interfaces (0.0.0.0)');
  });

  server.on('error', (err) => {
    console.error(`❌ Server Port Error: ${err.message}`);
    process.exit(1);
  });

  // Connect to DB in the background to avoid blocking startup
  connectDB().then(() => {
    console.log('✅ Database connection established');
  }).catch((err) => {
    console.error(`❌ Database connection failed: ${err.message}`);
    // We keep the server running so you can see logs and health checks pass
  });

  process.on('unhandledRejection', (err) => {
    console.error(`💥 Unhandled Rejection: ${err.message}`);
  });
};

startServer();
