const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'User'
  }
}, {
  timestamps: true
});

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
  barcode: { type: String, unique: true, index: true },
  reviews: [reviewSchema],
  rating: { type: Number, required: true, default: 0 },
  numReviews: { type: Number, required: true, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
