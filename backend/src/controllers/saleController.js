const Sale = require('../models/Sale');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private/Admin
const getSales = async (req, res) => {
  const sales = await Sale.find({}).sort({ date: -1 });
  res.json(sales);
};

// @desc    Create a sale
// @route   POST /api/sales
// @access  Private/Admin
const createSale = async (req, res) => {
  const sale = new Sale(req.body);
  const createdSale = await sale.save();
  res.status(201).json(createdSale);
};

// @desc    Delete a sale
// @route   DELETE /api/sales/:id
// @access  Private/Admin
const deleteSale = async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (sale) {
    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale removed' });
  } else {
    res.status(404).json({ message: 'Sale not found' });
  }
};

module.exports = {
  getSales,
  createSale,
  deleteSale
};
