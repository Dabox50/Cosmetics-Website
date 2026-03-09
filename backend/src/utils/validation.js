const Joi = require('joi');

const validateOrder = (order) => {
  const schema = Joi.object({
    customerName: Joi.string().required(),
    customerEmail: Joi.string().email().required(),
    customerPhone: Joi.string().required(),
    shippingAddress: Joi.string().required(),
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
    notes: Joi.string().allow('')
  });

  return schema.validate(order);
};

const validateAdminLogin = (admin) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(admin);
};

module.exports = { validateOrder, validateAdminLogin };
