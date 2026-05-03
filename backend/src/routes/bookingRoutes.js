const express = require('express');
const router = express.Router();
const { getBookings, createBooking, deleteBooking, getAvailability } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getBookings);
router.get('/availability', getAvailability);
router.post('/', createBooking);
router.delete('/:id', protect, deleteBooking);

module.exports = router;
