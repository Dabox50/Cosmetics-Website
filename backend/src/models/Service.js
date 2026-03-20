const mongoose = require('mongoose');

const serviceSchema = mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  units: { type: String, required: true },
  price: { type: Number, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
