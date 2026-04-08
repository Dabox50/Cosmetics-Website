const express = require('express');
const router = express.Router();
const { createSale, getSales, deleteSale } = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createSale)
  .get(protect, getSales);

router.route('/:id')
  .delete(protect, deleteSale);

module.exports = router;
