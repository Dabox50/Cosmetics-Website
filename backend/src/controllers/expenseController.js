const Expense = require('../models/Expense');

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private/Admin
const createExpense = async (req, res, next) => {
  try {
    const expense = new Expense(req.body);
    const createdExpense = await expense.save();
    res.status(201).json(createdExpense);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private/Admin
const getExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({}).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (expense) {
      await Expense.findByIdAndDelete(req.params.id);
      res.json({ message: 'Expense removed' });
    } else {
      res.status(404).json({ message: 'Expense not found' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  deleteExpense
};
