const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { validateAdminLogin } = require('../utils/validation');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  const { error } = validateAdminLogin(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { password } = req.body;
  const admin = await Admin.findOne(); // Find the first admin

  if (admin && (await admin.matchPassword(password))) {
    res.json({
      _id: admin._id,
      email: admin.email,
      token: generateToken(admin._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid password' });
  }
};

module.exports = { loginAdmin };
