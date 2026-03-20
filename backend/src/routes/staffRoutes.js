const express = require('express');
const router = express.Router();
const { getStaff, createStaff, updateStaff, deleteStaff } = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getStaff);
router.post('/', protect, createStaff);
router.patch('/:id', protect, updateStaff);
router.delete('/:id', protect, deleteStaff);

module.exports = router;
