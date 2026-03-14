const Booking = require('../models/Booking');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
const getBookings = async (req, res) => {
  const bookings = await Booking.find({}).sort({ createdAt: -1 });
  res.json(bookings);
};

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Public
const createBooking = async (req, res) => {
  const { serviceId, serviceName, customerName, customerContact, note } = req.body;
  const booking = new Booking({ serviceId, serviceName, customerName, customerContact, note });
  const createdBooking = await booking.save();
  res.status(201).json(createdBooking);
};

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
const deleteBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (booking) {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking removed' });
  } else {
    res.status(404).json({ message: 'Booking not found' });
  }
};

module.exports = { getBookings, createBooking, deleteBooking };
