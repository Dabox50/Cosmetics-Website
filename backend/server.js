const dotenv = require('dotenv');
// Load environment variables
dotenv.config();

const connectDB = require('./src/config/db');
const app = require('./src/app');

// Connect to Database and start server
const startServer = async () => {
  const PORT = process.env.PORT || 5000;
  
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log('App is listening on all interfaces (IPv4/IPv6)');
  });

  server.on('error', (err) => {
    console.error(`Server Error: ${err.message}`);
    process.exit(1);
  });

  try {
    await connectDB();
    
    process.on('unhandledRejection', (err) => {
      console.log(`Error: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`Failed to connect to database: ${error.message}`);
    // We don't necessarily want to exit immediately if we want health checks to pass,
    // but the app won't work without a DB. 
    // For now, let's keep it running so you can see the logs.
  }
};

startServer();
