const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private/Admin
const getExpenses = async (req, res) => {
  const expenses = await Expense.find({}).sort({ date: -1 });
  res.json(expenses);
};

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private/Admin
const createExpense = async (req, res) => {
  const expense = new Expense(req.body);
  const createdExpense = await expense.save();
  res.status(201).json(createdExpense);
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
const deleteExpense = async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (expense) {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense removed' });
  } else {
    res.status(404).json({ message: 'Expense not found' });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense
};
