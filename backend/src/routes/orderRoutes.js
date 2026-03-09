const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getDashboardSummary
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', createOrder);
router.get('/', protect, getOrders);
router.get('/dashboard/summary', protect, getDashboardSummary);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, updateOrderStatus);
router.delete('/:id', protect, deleteOrder);

module.exports = router;
