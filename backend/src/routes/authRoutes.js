const express = require('express');
const router = express.Router();
const { 
  login, 
  inviteStaff, 
  acceptInvitation, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/invite', protect, admin, inviteStaff);
router.post('/accept-invite', acceptInvitation);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
