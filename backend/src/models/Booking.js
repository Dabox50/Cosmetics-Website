const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  serviceName: { type: String, required: true },
  customerName: { type: String, required: true },
  customerContact: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:mm
  note: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
