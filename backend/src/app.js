const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
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
const roleRoutes = require('./routes/roleRoutes');

const app = express();

// --- 1. ABSOLUTE TOP: MANUAL CORS (Fixes lines 52-54 in collections.js) ---
app.use((req, res, next) => {
  const origin = req.get('origin');
  const allowedOrigins = [
    'https://www.shayorscosmestics.com', 
    'https://shayorscosmestics.com', 
    'http://localhost:5500', 
    'http://127.0.0.1:5500'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// --- 2. HEALTH CHECKS ---
app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/health/db', (req, res) => {
  const status = {
    connected: mongoose.connection.readyState === 1,
    state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    host: mongoose.connection.host
  };
  res.status(status.connected ? 200 : 503).json(status);
});

// --- 3. DATABASE GUARD (Prevents 500/503 crashes) ---
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      message: 'Database is still connecting. Please wait 5 seconds and refresh.',
      state: mongoose.connection.readyState
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

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
