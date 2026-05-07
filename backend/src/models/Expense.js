const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema({
  date: { type: Date, required: true },
  code: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  vendor: { type: String },
  paymentMethod: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending', 'Partly Paid', 'Unpaid'], default: 'Paid' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
