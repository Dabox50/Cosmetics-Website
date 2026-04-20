const express = require('express');
const router = express.Router();
const { getAdjustments, createAdjustment } = require('../controllers/adjustmentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getAdjustments)
  .post(protect, createAdjustment);

module.exports = router;
