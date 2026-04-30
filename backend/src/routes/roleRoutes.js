const express = require('express');
const router = express.Router();
const {
  getRoles,
  createRole,
  deleteRole
} = require('../controllers/roleController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, admin, getRoles)
  .post(protect, admin, createRole);

router.route('/:id')
  .delete(protect, admin, deleteRole);

module.exports = router;
