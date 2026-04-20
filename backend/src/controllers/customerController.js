const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  const customers = await Customer.find({});
  res.json(customers);
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  const customer = await Customer.create(req.body);
  res.status(201).json(customer);
};

// @desc    Update a customer
// @route   PATCH /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (customer) {
    Object.assign(customer, req.body);
    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } else {
    res.status(404).json({ message: 'Customer not found' });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (customer) {
    await customer.deleteOne();
    res.json({ message: 'Customer removed' });
  } else {
    res.status(404).json({ message: 'Customer not found' });
  }
};

module.exports = { getCustomers, createCustomer, updateCustomer, deleteCustomer };
