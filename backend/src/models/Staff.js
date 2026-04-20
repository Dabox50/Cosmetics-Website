const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: false // Optional initially, set during invitation acceptance
  },
  role: {
    type: String,
    required: true
  },
  invitationToken: String,
  invitationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isActivated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Method to compare password
staffSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password before saving
staffSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    next();
  } else {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  }
});

module.exports = mongoose.model('Staff', staffSchema);
