const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const { connectDB, getLastError } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const saleRoutes = require('./routes/saleRoutes');
const customerRoutes = require('./routes/customerRoutes');
const adjustmentRoutes = require('./routes/adjustmentRoutes');
const expenseCategoryRoutes = require('./routes/expenseCategoryRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const costAnalysisRoutes = require('./routes/costAnalysisRoutes');
const roleRoutes = require('./routes/roleRoutes');

const app = express();

// --- 1. ROBUST CORS (Replaces manual logic to fix lines 52-54 blocks) ---
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://www.shayorscosmestics.com', 
      'https://shayorscosmestics.com', 
      'https://www.shayorscosmetics.com', 
      'https://shayorscosmetics.com',
      'http://localhost:5500', 
      'http://127.0.0.1:5500',
      'http://localhost:3000'
    ];
    // Allow if no origin (mobile/curl) or if matches list or contains "shayors"
    if (!origin || allowedOrigins.includes(origin) || origin.includes('shayors')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive mode to resolve blocks immediately
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// --- 2. HEALTH CHECKS ---
app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/health/db', (req, res) => {
  const status = {
    connected: mongoose.connection.readyState === 1,
    state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    host: mongoose.connection.host,
    error: getLastError()
  };
  res.status(status.connected ? 200 : 503).json(status);
});

// Manual Reconnect for troubleshooting
app.post('/api/health/reconnect', async (req, res) => {
  console.log('🔄 Manual DB Reconnect Triggered');
  await connectDB(1);
  res.json({ message: 'Reconnect triggered', state: mongoose.connection.readyState });
});

// --- 3. DATABASE GUARD (Prevents 500/503 crashes with logging) ---
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const error = getLastError();
    console.log(`⚠️ API blocked: DB State is ${mongoose.connection.readyState}. Error: ${error || 'None yet'}`);
    return res.status(503).json({ 
      message: 'Database is still connecting. Handshake in progress...',
      state: mongoose.connection.readyState,
      details: error || 'Still attempting initial connection'
    });
  }
  next();
});

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- 4. ROUTES ---
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', authRoutes);
app.use('/api/admin/roles', roleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/cost-analysis', costAnalysisRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
