const Adjustment = require('../models/Adjustment');

// @desc    Get all adjustments
// @route   GET /api/adjustments
// @access  Private
const getAdjustments = async (req, res) => {
  const adjustments = await Adjustment.find({}).sort({ createdAt: -1 });
  res.json(adjustments);
};

// @desc    Create an adjustment
// @route   POST /api/adjustments
// @access  Private
const createAdjustment = async (req, res) => {
  const { productId, productName, type, qty, reason } = req.body;
  const adjustment = await Adjustment.create({
    product: productId,
    productName,
    type,
    qty,
    reason
  });
  res.status(201).json(adjustment);
};

module.exports = { getAdjustments, createAdjustment };
