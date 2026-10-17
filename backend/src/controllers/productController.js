const mongoose = require('mongoose');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Order = require('../models/Order');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const category = req.query.category ? { category: req.query.category } : {};
    // Exclude heavy text fields for faster list fetching
    // Use .lean() for faster read-only query
    const products = await Product.find({ ...category })
      .select('-description -howToUse -ingredients -reviews')
      .lean();
    res.json(products);
  } catch (error) {
    next(error);
  }
};

const getBestSellingProducts = async (req, res, next) => {
  try {
    const [saleTotals, orderTotals] = await Promise.all([
      Sale.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', unitsSold: { $sum: '$items.quantity' } } }
      ]),
      Order.aggregate([
        {
          $match: {
            orderStatus: { $nin: ['cancelled'] },
            $or: [
              { paymentStatus: 'paid' },
              { orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered', 'completed'] } }
            ]
          }
        },
        { $unwind: '$items' },
        { $group: { _id: '$items.productId', unitsSold: { $sum: '$items.quantity' } } }
      ])
    ]);

    const unitsSoldByProduct = new Map();
    [...saleTotals, ...orderTotals].forEach(({ _id, unitsSold }) => {
      if (_id) {
        const productId = String(_id);
        unitsSoldByProduct.set(productId, (unitsSoldByProduct.get(productId) || 0) + unitsSold);
      }
    });

    const productIds = [...unitsSoldByProduct.keys()]
      .filter(productId => mongoose.Types.ObjectId.isValid(productId));

    let topProducts = [];
    if (productIds.length > 0) {
      const soldProducts = await Product.find({ _id: { $in: productIds } })
        .select('-ingredients -reviews')
        .lean();

      topProducts = soldProducts
        .map(product => ({
          ...product,
          unitsSold: unitsSoldByProduct.get(String(product._id)) || 0
        }))
        .sort((a, b) => b.unitsSold - a.unitsSold || a.name.localeCompare(b.name));
    }

    // If fewer than 4 bestsellers from sales history, backfill with top-rated and available inventory products
    if (topProducts.length < 4) {
      const existingIds = topProducts.map(p => p._id);
      const needed = 4 - topProducts.length;
      const fillProducts = await Product.find({ _id: { $nin: existingIds }, stock: { $gt: 0 } })
        .select('-ingredients -reviews')
        .sort({ rating: -1, numReviews: -1, createdAt: -1 })
        .limit(needed)
        .lean();

      let backfilled = fillProducts.map(p => ({ ...p, unitsSold: 0 }));

      // If still fewer than 4 (e.g. stock <= 0), fetch any remaining products from catalog
      if (topProducts.length + backfilled.length < 4) {
        const allExistingIds = [...existingIds, ...backfilled.map(p => p._id)];
        const remainingNeeded = 4 - (topProducts.length + backfilled.length);
        const anyProducts = await Product.find({ _id: { $nin: allExistingIds } })
          .select('-ingredients -reviews')
          .sort({ createdAt: -1 })
          .limit(remainingNeeded)
          .lean();
        backfilled = backfilled.concat(anyProducts.map(p => ({ ...p, unitsSold: 0 })));
      }

      topProducts = topProducts.concat(backfilled);
    }

    res.json(topProducts.slice(0, 4));
  } catch (error) {
    next(error);
  }
};


const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = new Product(req.body);
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      Object.assign(product, req.body);
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    next(error);
  }
};

const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment, name } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      const review = {
        name: name,
        rating: Number(rating),
        comment,
        user: req.user ? req.user._id : undefined,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    next(error);
  }
};

const getProductByBarcode = async (req, res, next) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found with this barcode' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getBestSellingProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview
};
