const mongoose = require('mongoose');

const customerSchema = mongoose.Schema({
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  invoiceNo: String,
  name: { type: String, required: true },
  contact: { type: String, required: true },
  product: String,
  totalUnits: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  partlyPaid: { type: Number, default: 0 },
  dueDate: String,
  status: { type: String, enum: ['Paid', 'Partly Paid', 'Unpaid'], default: 'Unpaid' },
  email: String,
  address: String,
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
