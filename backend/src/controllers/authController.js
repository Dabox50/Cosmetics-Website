const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const { validateAdminLogin } = require('../utils/validation');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

const getBaseUrl = (req) => {
  if (process.env.FRONTEND_URL && process.env.FRONTEND_URL !== 'undefined') {
    return process.env.FRONTEND_URL;
  }
  return req.get('origin') || 'https://www.shayorscosmestics.com';
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth admin/staff & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;
  
  // 1. Try to find Admin
  let user;
  let isStaff = false;

  if (!email) {
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

  // Check if admin with this email exists
  const adminExists = await Admin.findOne({ email });
  if (adminExists) {
    return res.status(400).json({ message: 'This email is registered as an Admin and cannot be added as staff' });
  }

  let staff = await Staff.findOne({ email });
  
  if (staff) {
    if (staff.isActivated) {
      return res.status(400).json({ message: 'Staff with this email already exists and is already active' });
    }
    // Update role in case it changed
    staff.role = role;
  } else {
    staff = new Staff({ email, role });
  }

  const invitationToken = crypto.randomBytes(32).toString('hex');
  const invitationExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  staff.invitationToken = invitationToken;
  staff.invitationExpires = invitationExpires;
  await staff.save();

  const baseUrl = getBaseUrl(req);
  const inviteUrl = `${baseUrl}/Inventory/inventory.html?inviteToken=${invitationToken}`;

  const message = `You've been invited to join Shayors Cosmetics as ${role}. 
                   Please click the link below to set your password and access the inventory:
                   \n\n ${inviteUrl}`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #d4af37; border-radius: 10px; max-width: 600px; background-color: #000; color: #fff;">
      <h2 style="color: #d4af37; text-align: center;">Shayors Cosmestics Invitation</h2>
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

  if (!token) {
    return res.status(400).json({ message: 'Invitation token is missing' });
  }

  const trimmedToken = token.trim();

  const staff = await Staff.findOne({
    invitationToken: trimmedToken
  });

  if (!staff) {
    return res.status(400).json({ message: 'Invalid invitation token' });
  }

  if (staff.invitationExpires && staff.invitationExpires < new Date()) {
    return res.status(400).json({ message: 'Invitation token has expired' });
  }

  staff.password = password;
  staff.isActivated = true;
  staff.invitationToken = undefined;
  staff.invitationExpires = undefined;
  await staff.save();

  // Notify Admins
  try {
    const admins = await Admin.find({});
    const adminEmails = admins.map(a => a.email);
    
    if (adminEmails.length > 0) {
      await sendEmail({
        email: adminEmails.join(','),
        subject: 'New Staff Joined - Shayors Cosmetics',
        message: `New staff member ${staff.email} has accepted the invitation and joined as ${staff.role}.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #d4af37; border-radius: 10px; max-width: 600px; background-color: #000; color: #fff;">
            <h2 style="color: #d4af37; text-align: center;">New Staff Member Joined</h2>
            <p style="font-size: 16px;">Hello Admin,</p>
            <p style="font-size: 16px;">A new staff member has successfully activated their account:</p>
            <ul style="font-size: 16px; color: #d4af37;">
              <li><strong>Email:</strong> ${staff.email}</li>
              <li><strong>Role:</strong> ${staff.role}</li>
              <li><strong>Join Date:</strong> ${new Date().toLocaleString()}</li>
            </ul>
            <p style="font-size: 14px; color: #aaa; margin-top: 20px; border-top: 1px solid #333; padding-top: 15px;">
              This is an automated notification from the Shayors Cosmetics Inventory System.
            </p>
          </div>
        `
      });
    }
  } catch (error) {
    console.error('Failed to send joining notification to admins:', error);
  }

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

  const baseUrl = getBaseUrl(req);
  const resetUrl = `${baseUrl}/Inventory/inventory.html?resetToken=${resetToken}`;
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

// @desc    Get all staff (including Master Admins)
// @route   GET /api/admin/staff
// @access  Private/Admin
const getAllStaff = async (req, res) => {
  const staff = await Staff.find({}).select('-password -invitationToken -invitationExpires');
  const admins = await Admin.find({}).select('email');
  
  const combined = [
    ...admins.map(a => ({ 
      _id: a._id, 
      email: a.email, 
      role: 'Master Admin', 
      isActivated: true, 
      isMaster: true 
    })),
    ...staff
  ];
  
  res.json(combined);
};

// @desc    Resend all pending invitations
// @route   POST /api/admin/resend-all
// @access  Private/Admin
const resendAllInvites = async (req, res) => {
  const pendingStaff = await Staff.find({ isActivated: false });
  
  if (pendingStaff.length === 0) {
    return res.status(200).json({ message: 'No pending invitations to resend' });
  }

  const baseUrl = getBaseUrl(req);
  let successCount = 0;
  for (const staff of pendingStaff) {
    try {
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const invitationExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;

      staff.invitationToken = invitationToken;
      staff.invitationExpires = invitationExpires;
      await staff.save();

      const inviteUrl = `${baseUrl}/Inventory/inventory.html?inviteToken=${invitationToken}`;
      const message = `You've been invited to join Shayors Cosmetics as ${staff.role}. Please click the link below to set your password: \n\n ${inviteUrl}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #d4af37; border-radius: 10px; max-width: 600px; background-color: #000; color: #fff;">
          <h2 style="color: #d4af37; text-align: center;">Shayors Cosmetics Invitation (Reminders)</h2>
          <p style="font-size: 16px;">Hello,</p>
          <p style="font-size: 16px;">This is a reminder that you've been invited to join the <strong>Shayors Cosmetics</strong> team as a <strong>${staff.role}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="display: inline-block; padding: 15px 30px; background-color: #d4af37; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">Accept Invitation</a>
          </div>
          <p style="word-break: break-all; color: #d4af37;">${inviteUrl}</p>
        </div>
      `;

      await sendEmail({
        email: staff.email,
        subject: 'Staff Invitation Reminder - Shayors Cosmetics',
        message,
        html
      });
      successCount++;
    } catch (err) {
      console.error('Failed to resend to ' + staff.email + ':', err);
    }
  }

  res.json({ message: 'Successfully resent ' + successCount + ' invitations.' });
};

// @desc    Delete staff
// @route   DELETE /api/admin/staff/:id
// @access  Private/Admin
const deleteStaff = async (req, res) => {
  const staff = await Staff.findById(req.params.id);

  if (staff) {
    await staff.deleteOne();
    res.json({ message: 'Staff removed' });
  } else {
    res.status(404).json({ message: 'Staff not found' });
  }
};

module.exports = { 
  login, 
  inviteStaff, 
  acceptInvitation, 
  forgotPassword, 
  resetPassword,
  getAllStaff,
  deleteStaff,
  resendAllInvites
};
