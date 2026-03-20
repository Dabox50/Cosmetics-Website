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
const saleRoutes = require('./routes/saleRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const customerRoutes = require('./routes/customerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const adjustmentRoutes = require('./routes/adjustmentRoutes');
const staffRoutes = require('./routes/staffRoutes');
const roleRoutes = require('./routes/roleRoutes');

const app = express();

// 1. Configure CORS
const allowedOrigins = [
  "https://dabox50.github.io", 
  "http://127.0.0.1:5500", 
  "http://localhost:5500",
  "https://shayorscosmestics.com",
  "https://www.shayorscosmestics.com"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow any local origin (e.g., from mobile) in development
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes('192.168.') || origin.includes('10.') || origin.includes('172.')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true
}));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.includes('192.168.') || origin.includes('10.') || origin.includes('172.'))) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
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
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/roles', roleRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
