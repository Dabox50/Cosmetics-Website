const express = require('express');
const cors = require('cors');
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

app.use((req, res, next) => {
  const origin = req.get('origin') || req.get('referer') || 'Unknown Origin';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - From: ${origin}`);
  next();
});

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('dev'));
}

// Simplified CORS for better compatibility
app.use(cors({
  origin: true, // Reflect request origin back (allows any origin in the allowed list)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

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

app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/health/db', async (req, res) => {
  const mongoose = require('mongoose');
  const status = {
    connected: mongoose.connection.readyState === 1,
    state: mongoose.connection.readyState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    host: mongoose.connection.host,
    db: mongoose.connection.name
  };
  
  if (status.connected) {
    res.status(200).json(status);
  } else {
    res.status(503).json(status);
  }
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
