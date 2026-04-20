const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const { validateAdminLogin } = require('../utils/validation');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth admin/staff & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  console.log("Login request received:", req.body);
  const { email, password } = req.body;
  
  // 1. Try to find Admin
  let user;
  let isStaff = false;

  if (!email) {
    // If no email, find the first admin (legacy/easy login)
    user = await Admin.findOne();
  } else {
    user = await Admin.findOne({ email });
  }

  // 2. If no admin, try staff
  if (!user && email) {
    user = await Staff.findOne({ email });
    isStaff = true;
  }

  if (user && (await user.matchPassword(password))) {
    // Check if staff is activated
    if (isStaff && !user.isActivated) {
      return res.status(401).json({ message: 'Account not activated. Check your email for invitation.' });
    }

    res.json({
      _id: user._id,
      email: user.email,
      role: isStaff ? user.role : 'Admin',
      token: generateToken(user._id),
      isStaff
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Invite new staff
// @route   POST /api/auth/invite
// @access  Private/Admin
const inviteStaff = async (req, res) => {
  const { email, role } = req.body;

  const staffExists = await Staff.findOne({ email });
  if (staffExists) return res.status(400).json({ message: 'Staff with this email already exists' });

  const invitationToken = crypto.randomBytes(32).toString('hex');
  const invitationExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  const staff = await Staff.create({
    email,
    role,
    invitationToken,
    invitationExpires
  });

  const inviteUrl = `${process.env.FRONTEND_URL}/Inventory/inventory.html?inviteToken=${invitationToken}`;

  const message = `You've been invited to join Shayors Cosmetics as ${role}. 
                   Please click the link below to set your password and access the inventory:
                   \n\n ${inviteUrl}`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #d4af37; border-radius: 10px; max-width: 600px; background-color: #000; color: #fff;">
      <h2 style="color: #d4af37; text-align: center;">Shayors Cosmetics Invitation</h2>
      <p style="font-size: 16px;">Hello,</p>
      <p style="font-size: 16px;">You've been invited to join the <strong>Shayors Cosmetics</strong> team as a <strong>${role}</strong>.</p>
      <p style="font-size: 16px;">Click the button below to set your password and access the inventory dashboard:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" style="display: inline-block; padding: 15px 30px; background-color: #d4af37; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">Accept Invitation</a>
      </div>
      <p style="font-size: 14px; color: #aaa; margin-top: 20px; border-top: 1px solid #333; padding-top: 15px;">
        If the button above doesn't work, please copy and paste this link into your browser:
      </p>
      <p style="word-break: break-all; color: #d4af37;">${inviteUrl}</p>
      <p style="font-size: 12px; color: #777; margin-top: 20px;">This invitation link will expire in 7 days.</p>
    </div>
  `;

  try {
    await sendEmail({
      email: staff.email,
      subject: 'Staff Invitation - Shayors Cosmetics',
      message,
      html
    });
    res.status(200).json({ message: 'Invitation email sent successfully' });
  } catch (error) {
    staff.invitationToken = undefined;
    staff.invitationExpires = undefined;
    await staff.save();
    res.status(500).json({ message: 'Error sending invitation email' });
  }
};

// @desc    Accept invitation & set password
// @route   POST /api/auth/accept-invite
// @access  Public
const acceptInvitation = async (req, res) => {
  const { token, password } = req.body;

  const staff = await Staff.findOne({
    invitationToken: token,
    invitationExpires: { $gt: Date.now() }
  });

  if (!staff) return res.status(400).json({ message: 'Invalid or expired invitation token' });

  staff.password = password;
  staff.isActivated = true;
  staff.invitationToken = undefined;
  staff.invitationExpires = undefined;
  await staff.save();

  res.status(200).json({ message: 'Account activated successfully. You can now login.' });
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  let user = await Admin.findOne({ email });
  if (!user) {
    user = await Staff.findOne({ email });
  }

  if (!user) return res.status(404).json({ message: 'User not found with this email' });

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/Inventory/inventory.html?resetToken=${resetToken}`;
  const message = `You requested a password reset. Click the link below to reset your password:
                   \n\n ${resetUrl}`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #d4af37; border-radius: 10px; max-width: 600px; background-color: #000; color: #fff;">
      <h2 style="color: #d4af37; text-align: center;">Password Reset Request</h2>
      <p style="font-size: 16px;">Hello,</p>
      <p style="font-size: 16px;">You requested to reset your password for the Shayors Cosmetics Inventory system.</p>
      <p style="font-size: 16px;">Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; padding: 15px 30px; background-color: #d4af37; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #aaa; margin-top: 20px; border-top: 1px solid #333; padding-top: 15px;">
        If the button above doesn't work, please copy and paste this link into your browser:
      </p>
      <p style="word-break: break-all; color: #d4af37;">${resetUrl}</p>
      <p style="font-size: 12px; color: #777; margin-top: 20px;">This reset link will expire in 1 hour.</p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message,
      html
    });
    res.status(200).json({ message: 'Reset email sent successfully' });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(500).json({ message: 'Error sending reset email' });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  let user = await Admin.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    user = await Staff.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
  }

  if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: 'Password reset successful' });
};

module.exports = { 
  login, 
  inviteStaff, 
  acceptInvitation, 
  forgotPassword, 
  resetPassword 
};
