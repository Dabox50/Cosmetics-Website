const Staff = require('../models/Staff');

const getStaff = async (req, res) => {
  const staff = await Staff.find({});
  res.json(staff);
};

const createStaff = async (req, res) => {
  const staff = new Staff(req.body);
  const createdStaff = await staff.save();
  res.status(201).json(createdStaff);
};

const updateStaff = async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (staff) {
    Object.assign(staff, req.body);
    const updatedStaff = await staff.save();
    res.json(updatedStaff);
  } else {
    res.status(404).json({ message: 'Staff not found' });
  }
};

const deleteStaff = async (req, res) => {
  await Staff.findByIdAndDelete(req.params.id);
  res.json({ message: 'Staff removed' });
};

module.exports = { getStaff, createStaff, updateStaff, deleteStaff };
