const mongoose = require('mongoose');

const saleItemSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true }
});

const saleSchema = mongoose.Schema({
  items: [saleItemSchema],
  totalAmount: { type: Number, required: true },
  totalItems: { type: Number, required: true },
  paymentMethod: { type: String, required: true, enum: ['Cash', 'Transfer', 'Card'] },
  customerName: { type: String },
  customerContact: { type: String },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'partly paid', 'pending'],
    default: 'paid'
  },
  charges: [{
    name: String,
    value: Number,
    type: { type: String, enum: ['fixed', 'percent'] },
    isProfit: Boolean,
    isHidden: Boolean
  }],
  platform: { type: String, default: 'POS' },
  saleDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema);
