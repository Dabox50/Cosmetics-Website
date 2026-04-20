const ExpenseCategory = require('../models/ExpenseCategory');

// @desc    Get all expense categories
// @route   GET /api/expense-categories
// @access  Private
const getExpenseCategories = async (req, res, next) => {
  try {
    const categories = await ExpenseCategory.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new expense category
// @route   POST /api/expense-categories
// @access  Private/Admin
const createExpenseCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const exists = await ExpenseCategory.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    const category = await ExpenseCategory.create({ name });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense category
// @route   DELETE /api/expense-categories/:id
// @access  Private/Admin
const deleteExpenseCategory = async (req, res, next) => {
  try {
    const category = await ExpenseCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    await ExpenseCategory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenseCategories,
  createExpenseCategory,
  deleteExpenseCategory
};
