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
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/invite', protect, admin, inviteStaff);
router.get('/staff', protect, admin, getAllStaff);
router.delete('/staff/:id', protect, admin, deleteStaff);
router.post('/resend-all', protect, admin, resendAllInvites);
router.post('/accept-invite', acceptInvitation);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
