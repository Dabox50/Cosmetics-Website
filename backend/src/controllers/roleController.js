const Role = require('../models/Role');

// @desc    Get all roles
// @route   GET /api/admin/roles
// @access  Private/Admin
const getRoles = async (req, res) => {
  const roles = await Role.find({});
  res.json(roles);
};

// @desc    Create a role
// @route   POST /api/admin/roles
// @access  Private/Admin
const createRole = async (req, res) => {
  const { name, permissions } = req.body;

  const roleExists = await Role.findOne({ name });

  if (roleExists) {
    return res.status(400).json({ message: 'Role already exists' });
  }

  const role = await Role.create({
    name,
    permissions
  });

  if (role) {
    res.status(201).json(role);
  } else {
    res.status(400).json({ message: 'Invalid role data' });
  }
};

// @desc    Delete a role
// @route   DELETE /api/admin/roles/:id
// @access  Private/Admin
const deleteRole = async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (role) {
    await role.deleteOne();
    res.json({ message: 'Role removed' });
  } else {
    res.status(404).json({ message: 'Role not found' });
  }
};

module.exports = {
  getRoles,
  createRole,
  deleteRole
};
