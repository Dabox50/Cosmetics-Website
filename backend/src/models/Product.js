const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  brand: { type: String },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  threshold: { type: Number, default: 5 },
  image: { type: String },
  size: { type: String },
  ingredients: { type: String },
  shade: { type: String },
  skinTypes: { type: String },
  review: { type: String },
  description: { type: String },
  howToUse: { type: String },
  skinConcern: { type: String },
  barcode: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
