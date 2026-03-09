const Order = require('../models/Order');
const { validateOrder } = require('../utils/validation');
const nodemailer = require('nodemailer');

// Helper to send email alerts
const sendEmailAlert = async (order) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Shayors Cosmetics" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Order Alert: ${order._id}`,
    html: `
      <h2>New Order Received!</h2>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Contact:</strong> ${order.customerPhone} | ${order.customerEmail}</p>
      <p><strong>Total Amount:</strong> ₦${order.totalAmount.toLocaleString()}</p>
      <p><strong>Address:</strong> ${order.shippingAddress}</p>
      <h3>Items:</h3>
      <ul>
        ${order.items.map(item => `<li>${item.productName} (Qty: ${item.quantity}) - ₦${item.price.toLocaleString()}</li>`).join('')}
      </ul>
      <p>Please log in to the admin panel to manage this order.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email alert sent successfully');
  } catch (error) {
    console.error('Email alert failed:', error);
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  const { error } = validateOrder(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const order = new Order(req.body);
  const createdOrder = await order.save();

  // Send alert (async - don't block response)
  sendEmailAlert(createdOrder);

  res.status(201).json(createdOrder);
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const status = req.query.status ? { orderStatus: req.query.status } : {};

  const count = await Order.countDocuments({ ...status });
  const orders = await Order.find({ ...status })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ orders, page, pages: Math.ceil(count / pageSize) });
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private/Admin
const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);

  if (order) {
    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order removed' });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Get dashboard summary
// @route   GET /api/orders/dashboard/summary
// @access  Private/Admin
const getDashboardSummary = async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
  const totalRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  res.json({
    totalOrders,
    pendingOrders,
    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
  });
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getDashboardSummary
};
