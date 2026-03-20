const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  serviceName: { type: String, required: true },
  customerName: { type: String, required: true },
  customerContact: { type: String, required: true },
  note: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
