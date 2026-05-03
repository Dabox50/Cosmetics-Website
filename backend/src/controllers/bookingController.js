const Booking = require('../models/Booking');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
const getBookings = async (req, res) => {
  const bookings = await Booking.find({}).sort({ date: 1, time: 1 });
  res.json(bookings);
};

// @desc    Get availability for a date
// @route   GET /api/bookings/availability
// @access  Public
const getAvailability = async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'Date is required' });
  const bookings = await Booking.find({ date, status: { $ne: 'cancelled' } });
  const bookedTimes = bookings.map(b => b.time);
  res.json({ bookedTimes });
};

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Public
const createBooking = async (req, res) => {
  const { serviceId, serviceName, customerName, customerContact, date, time, note } = req.body;

  // Simple collision check (exact time)
  const existingBooking = await Booking.findOne({ date, time, status: { $ne: 'cancelled' } });
  if (existingBooking) {
    return res.status(400).json({ message: 'This time slot is already booked. Please choose another time.' });
  }

  const booking = new Booking({ serviceId, serviceName, customerName, customerContact, date, time, note });
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

module.exports = { getBookings, createBooking, deleteBooking, getAvailability };
