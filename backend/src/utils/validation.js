const Joi = require('joi');

const validateOrder = (order) => {
  const schema = Joi.object({
    customerName: Joi.string().required(),
    customerEmail: Joi.string().email().allow('').optional(),
    customerPhone: Joi.string().allow('').optional(),
    shippingAddress: Joi.string().allow('').optional(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        productName: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
        price: Joi.number().min(0).required()
      })
    ).min(1).required(),
    totalAmount: Joi.number().min(0).required(),
    paymentMethod: Joi.string().required(),
    paymentStatus: Joi.string().valid('unpaid', 'paid', 'failed', 'partly paid').optional(),
    orderStatus: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'completed').optional(),
    platform: Joi.string().optional(),
    notes: Joi.string().allow('')
  });

  return schema.validate(order);
};

const validateAdminLogin = (admin) => {
  const schema = Joi.object({
    password: Joi.string().required()
  });

  return schema.validate(admin);
};

module.exports = { validateOrder, validateAdminLogin };
