const CostAnalysis = require('../models/CostAnalysis');

// @desc    Create new cost analysis
// @route   POST /api/cost-analysis
// @access  Private/Admin
const createCostAnalysis = async (req, res, next) => {
  try {
    const analysis = new CostAnalysis(req.body);
    const createdAnalysis = await analysis.save();
    res.status(201).json(createdAnalysis);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all cost analysis
// @route   GET /api/cost-analysis
// @access  Private/Admin
const getCostAnalysis = async (req, res, next) => {
  try {
    const analysis = await CostAnalysis.find({}).sort({ date: -1 });
    res.json(analysis);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a cost analysis
// @route   DELETE /api/cost-analysis/:id
// @access  Private/Admin
const deleteCostAnalysis = async (req, res, next) => {
  try {
    const analysis = await CostAnalysis.findById(req.params.id);
    if (analysis) {
      await CostAnalysis.findByIdAndDelete(req.params.id);
      res.json({ message: 'Cost Analysis removed' });
    } else {
      res.status(404).json({ message: 'Cost Analysis not found' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCostAnalysis,
  getCostAnalysis,
  deleteCostAnalysis
};
