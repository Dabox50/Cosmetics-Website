const mongoose = require('mongoose');

const adjustmentSchema = mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  type: { type: String, enum: ['Add', 'Subtract'], required: true },
  qty: { type: Number, required: true },
  reason: { type: String, required: true },
  user: { type: String, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Adjustment', adjustmentSchema);
