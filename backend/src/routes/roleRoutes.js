const express = require('express');
const router = express.Router();
const { getRoles, createOrUpdateRole, deleteRole } = require('../controllers/roleController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getRoles);
router.post('/', protect, createOrUpdateRole);
router.delete('/:name', protect, deleteRole);

module.exports = router;
