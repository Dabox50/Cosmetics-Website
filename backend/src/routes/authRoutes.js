const express = require('express');
const router = express.Router();
const { 
  login, 
  inviteStaff, 
  acceptInvitation, 
  forgotPassword, 
  resetPassword,
  getAllStaff,
  deleteStaff,
  resendAllInvites
} = require('../controllers/authController');
const {
  getRoles,
  createRole,
  deleteRole
} = require('../controllers/roleController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/invite', protect, admin, inviteStaff);
router.get('/staff', protect, admin, getAllStaff);
router.delete('/staff/:id', protect, admin, deleteStaff);
router.post('/resend-all', protect, admin, resendAllInvites);
router.post('/accept-invite', acceptInvitation);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Role routes
router.get('/roles', protect, admin, getRoles);
router.post('/roles', protect, admin, createRole);
router.delete('/roles/:id', protect, admin, deleteRole);

module.exports = router;
