const mongoose = require('mongoose');

const adjustmentSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String,
  type: {
    type: String,
    enum: ['Restock', 'Stock Out'],
    required: true
  },
  qty: { type: Number, required: true },
  reason: String,
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Adjustment', adjustmentSchema);
