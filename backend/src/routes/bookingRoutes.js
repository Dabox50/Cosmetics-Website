const express = require('express');
const router = express.Router();
const { getBookings, createBooking, deleteBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getBookings);
router.post('/', createBooking);
router.delete('/:id', protect, deleteBooking);

module.exports = router;
