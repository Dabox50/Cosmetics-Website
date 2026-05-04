const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
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

// --- 1. PRIORITY HEALTH CHECK ---
app.get('/health', (req, res) => res.status(200).send('OK'));

// --- 2. DATABASE STATUS CHECK ---
app.get('/api/health/db', (req, res) => {
  const status = {
    connected: mongoose.connection.readyState === 1,
    state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    host: mongoose.connection.host
  };
  res.status(status.connected ? 200 : 503).json(status);
});

// --- 3. DATABASE GUARD MIDDLEWARE ---
// Prevents 500 crashes by checking connection before running routes
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      message: 'Database is still connecting to Atlas. Please refresh in 5 seconds.',
      state: mongoose.connection.readyState
    });
  }
  next();
});

// --- 4. LOGGING & SECURITY ---
app.use((req, res, next) => {
  const origin = req.get('origin') || 'No Origin';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - From: ${origin}`);
  next();
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// --- 5. ROUTES ---
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
