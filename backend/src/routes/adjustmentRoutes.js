const express = require('express');
const router = express.Router();
const { getAdjustments, createAdjustment } = require('../controllers/adjustmentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAdjustments);
router.post('/', protect, createAdjustment);

module.exports = router;
