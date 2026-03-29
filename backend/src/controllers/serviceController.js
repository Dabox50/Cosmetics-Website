const Service = require('../models/Service');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  const services = await Service.find({});
  res.json(services);
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Admin
const createService = async (req, res) => {
  const { name, category, units, price, image } = req.body;
  const service = new Service({ name, category, units, price, image });
  const createdService = await service.save();
  res.status(201).json(createdService);
};

// @desc    Update a service
// @route   PATCH /api/services/:id
// @access  Private/Admin
const updateService = async (req, res) => {
  const { name, category, units, price, image } = req.body;
  const service = await Service.findById(req.params.id);

  if (service) {
    if (name) service.name = name;
    if (category) service.category = category;
    if (units) service.units = units;
    if (price) service.price = price;
    if (image) service.image = image;

    const updatedService = await service.save();
    res.json(updatedService);
  } else {
    res.status(404).json({ message: 'Service not found' });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin
const deleteService = async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (service) {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service removed' });
  } else {
    res.status(404).json({ message: 'Service not found' });
  }
};

module.exports = { getServices, createService, updateService, deleteService };
