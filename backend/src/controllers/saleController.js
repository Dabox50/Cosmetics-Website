const Sale = require('../models/Sale');
const Product = require('../models/Product');

// @desc    Create new sale and reduce stock
// @route   POST /api/sales
// @access  Private/Admin
const createSale = async (req, res, next) => {
  try {
    const { items, totalAmount, totalItems, paymentMethod, customerName, customerContact, charges, paymentStatus } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in sale' });
    }

    // Check stock availability for all items first
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.name} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }
    }

    // Create the sale
    const sale = new Sale({
      items,
      totalAmount,
      totalItems,
      paymentMethod,
      customerName,
      customerContact,
      charges,
      paymentStatus: paymentStatus || 'paid',
      platform: 'POS'
    });

    const createdSale = await sale.save();

    // Reduce stock for each product
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json(createdSale);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private/Admin
const getSales = async (req, res, next) => {
  try {
    const sales = await Sale.find({}).sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a sale
// @route   DELETE /api/sales/:id
// @access  Private/Admin
const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (sale) {
      await Sale.findByIdAndDelete(req.params.id);
      res.json({ message: 'Sale removed' });
    } else {
      res.status(404).json({ message: 'Sale not found' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getSales,
  deleteSale
};
