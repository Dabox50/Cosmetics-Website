const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

// 1. Configure CORS
const allowedOrigins = ["https://dabox50.github.io", "http://127.0.0.1:5500", "http://localhost:5500"];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.options("*", cors()); // Enable preflight for all routes

app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/admin', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/categories', categoryRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
