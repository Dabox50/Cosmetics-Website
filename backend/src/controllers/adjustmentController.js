const Adjustment = require('../models/Adjustment');

const getAdjustments = async (req, res) => {
  const adjustments = await Adjustment.find({}).sort({ date: -1 });
  res.json(adjustments);
};

const createAdjustment = async (req, res) => {
  const adjustment = new Adjustment(req.body);
  const createdAdjustment = await adjustment.save();
  res.status(201).json(createdAdjustment);
};

module.exports = { getAdjustments, createAdjustment };
