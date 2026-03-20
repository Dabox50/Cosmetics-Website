const Role = require('../models/Role');

const getRoles = async (req, res) => {
  const roles = await Role.find({});
  res.json(roles);
};

const createOrUpdateRole = async (req, res) => {
  const { name, permissions } = req.body;
  const role = await Role.findOne({ name });
  if (role) {
    role.permissions = permissions;
    const updatedRole = await role.save();
    res.json(updatedRole);
  } else {
    const newRole = new Role({ name, permissions });
    const createdRole = await newRole.save();
    res.status(201).json(createdRole);
  }
};

const deleteRole = async (req, res) => {
  await Role.findOneAndDelete({ name: req.params.name });
  res.json({ message: 'Role removed' });
};

module.exports = { getRoles, createOrUpdateRole, deleteRole };
