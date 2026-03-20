const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  code: { type: String },
  category: { type: String, required: true },
  description: { type: String, required: true },
  vendor: { type: String },
  paymentMethod: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, required: true, enum: ['Paid', 'Pending', 'Partly Paid'] }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
