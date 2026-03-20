const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getSuppliers);
router.post('/', protect, createSupplier);
router.patch('/:id', protect, updateSupplier);
router.delete('/:id', protect, deleteSupplier);

module.exports = router;
