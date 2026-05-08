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
        description: Joi.string().allow('').optional(),
        quantity: Joi.number().min(1).required(),
        price: Joi.number().min(0).required()
      })
    ).min(1).required(),
    totalAmount: Joi.number().min(0).required(),
    paymentMethod: Joi.string().required(),
    paymentStatus: Joi.string().valid('unpaid', 'paid', 'failed', 'partly paid').optional(),
    orderStatus: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'completed').optional(),
    platform: Joi.string().optional(),
    receiptInfo: Joi.string().allow('').optional(),
    notes: Joi.string().allow(''),
    charges: Joi.array().items(
      Joi.object({
        name: Joi.string().optional(),
        value: Joi.number().optional(),
        type: Joi.string().valid('fixed', 'percent').optional(),
        isDiscount: Joi.boolean().optional(),
        isProfit: Joi.boolean().optional(),
        isHidden: Joi.boolean().optional()
      })
    ).optional()
  });

  return schema.validate(order);
};

const validateAdminLogin = (admin) => {
  const schema = Joi.object({
    email: Joi.string().email().optional(),
    password: Joi.string().required()
  });

  return schema.validate(admin);
};

module.exports = { validateOrder, validateAdminLogin };
