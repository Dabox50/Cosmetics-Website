const mongoose = require('mongoose');

const staffSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  status: { type: String, default: 'Active' },
  contact: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Staff', staffSchema);
