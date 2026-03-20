const mongoose = require('mongoose');

const customerSchema = mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  invoiceNo: { type: String },
  name: { type: String, required: true },
  contact: { type: String },
  product: { type: String },
  totalUnits: { type: Number },
  totalAmount: { type: Number, required: true },
  partlyPaid: { type: Number, default: 0 },
  dueDate: { type: String },
  status: { type: String, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
