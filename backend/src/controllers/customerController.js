const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private/Admin
const getCustomers = async (req, res) => {
  const customers = await Customer.find({}).sort({ date: -1 });
  res.json(customers);
};

// @desc    Create/Update a customer record
// @route   POST /api/customers
// @access  Private/Admin
const createOrUpdateCustomer = async (req, res) => {
  const { id, ...data } = req.body;
  if (id && id.length > 20) { // MongoDB ID
      const customer = await Customer.findById(id);
      if (customer) {
        Object.assign(customer, data);
        const updatedCustomer = await customer.save();
        return res.json(updatedCustomer);
      }
  }
  const customer = new Customer(data);
  const createdCustomer = await customer.save();
  res.status(201).json(createdCustomer);
};

// @desc    Delete a customer record
// @route   DELETE /api/customers/:id
// @access  Private/Admin
const deleteCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (customer) {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer record removed' });
  } else {
    res.status(404).json({ message: 'Customer record not found' });
  }
};

module.exports = {
  getCustomers,
  createOrUpdateCustomer,
  deleteCustomer
};
