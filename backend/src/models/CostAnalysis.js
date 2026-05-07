const mongoose = require('mongoose');

const costAnalysisSchema = mongoose.Schema({
  date: { type: Date, required: true },
  productName: { type: String, required: true },
  category: { type: String, required: true },
  size: { type: String },
  rawMaterials: { type: Number, default: 0 },
  container: { type: Number, default: 0 },
  label: { type: Number, default: 0 },
  seals: { type: Number, default: 0 },
  logistics: { type: Number, default: 0 },
  totalInput: { type: Number, default: 0 },
  output: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('CostAnalysis', costAnalysisSchema);
