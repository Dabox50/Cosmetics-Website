const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: false },
  customerPhone: { type: String, required: false },
  shippingAddress: { type: String, required: false },
  items: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'failed', 'partly paid'],
    default: 'paid'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'completed'],
    default: 'completed'
  },
  platform: { type: String, default: 'In-Store' },
  notes: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
