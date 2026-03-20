const express = require('express');
const router = express.Router();
const { getCustomers, createOrUpdateCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCustomers);
router.post('/', protect, createOrUpdateCustomer);
router.delete('/:id', protect, deleteCustomer);

module.exports = router;
