const express = require('express');
const router = express.Router();
const { createCostAnalysis, getCostAnalysis, deleteCostAnalysis } = require('../controllers/costAnalysisController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createCostAnalysis)
  .get(protect, getCostAnalysis);

router.route('/:id')
  .delete(protect, deleteCostAnalysis);

module.exports = router;
