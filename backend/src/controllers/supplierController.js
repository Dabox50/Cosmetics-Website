const Supplier = require('../models/Supplier');

const getSuppliers = async (req, res) => {
  const suppliers = await Supplier.find({});
  res.json(suppliers);
};

const createSupplier = async (req, res) => {
  const supplier = new Supplier(req.body);
  const createdSupplier = await supplier.save();
  res.status(201).json(createdSupplier);
};

const updateSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (supplier) {
    Object.assign(supplier, req.body);
    const updatedSupplier = await supplier.save();
    res.json(updatedSupplier);
  } else {
    res.status(404).json({ message: 'Supplier not found' });
  }
};

const deleteSupplier = async (req, res) => {
  await Supplier.findByIdAndDelete(req.params.id);
  res.json({ message: 'Supplier removed' });
};

module.exports = { getSuppliers, createSupplier, updateSupplier, deleteSupplier };
