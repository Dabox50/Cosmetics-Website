const express = require('express');
const router = express.Router();
const { createExpense, getExpenses, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createExpense)
  .get(protect, getExpenses);

router.route('/:id')
  .delete(protect, deleteExpense);

module.exports = router;
