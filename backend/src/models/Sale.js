const mongoose = require('mongoose');

const saleSchema = mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  customer: { type: String, required: true, default: 'Walk-in Customer' },
  contact: { type: String },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    unitType: { type: String },
    actualQty: { type: Number },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  charges: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, required: true, enum: ['Paid', 'Unpaid', 'Partly Paid'] },
  paymentMethod: { type: String },
  amountPaid: { type: Number, default: 0 },
  platform: { type: String, default: 'Walk-in' },
  deliveryStatus: { type: String, default: 'Delivered' },
  note: { type: String },
  type: { type: String, default: 'product' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema);
