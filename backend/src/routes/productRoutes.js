const express = require('express');
const router = express.Router();
const {
  getProducts,
  getBestSellingProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getProducts);
router.get('/bestsellers', getBestSellingProducts);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/:id', getProductById);
router.post('/:id/reviews', createProductReview);
router.post('/', protect, createProduct);
router.patch('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
