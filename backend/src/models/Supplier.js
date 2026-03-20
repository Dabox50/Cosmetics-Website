const mongoose = require('mongoose');

const supplierSchema = mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String },
  category: { type: String },
  address: { type: String },
  totalSupplied: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { type: String, default: 'Active' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
