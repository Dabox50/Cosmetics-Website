const express = require('express');
const router = express.Router();
const { 
  getExpenseCategories, 
  createExpenseCategory, 
  deleteExpenseCategory 
} = require('../controllers/expenseCategoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getExpenseCategories)
  .post(protect, admin, createExpenseCategory);

router.route('/:id')
  .delete(protect, admin, deleteExpenseCategory);

module.exports = router;
