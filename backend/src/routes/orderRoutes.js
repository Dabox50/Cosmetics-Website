const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getDashboardSummary,
  getPaystackKey,
  verifyPaystackPayment
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', upload.single('receipt'), createOrder);
router.get('/paystack/key', getPaystackKey);
router.post('/paystack/verify', verifyPaystackPayment);
router.get('/', protect, getOrders);
router.get('/dashboard/summary', protect, getDashboardSummary);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, updateOrderStatus);
router.delete('/:id', protect, deleteOrder);

module.exports = router;
