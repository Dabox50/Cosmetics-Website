const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { validateOrder } = require('../utils/validation');
const nodemailer = require('nodemailer');
const { verifyReceipt } = require('../utils/receiptVerifier');

const sendEmailAlert = async (order) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const targetEmail = process.env.ADMIN_EMAIL || 'shayorscosmestics@gmail.com';
    const itemsHtml = (order.items || []).map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 8px; font-weight: 500;">${item.productName}</td>
        <td style="padding: 10px 8px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 8px; text-align: right;">₦${Number(item.price).toLocaleString()}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 600;">₦${(item.quantity * item.price).toLocaleString()}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"Shayors Cosmetics" <${process.env.EMAIL_USER || 'alaminlamina5@gmail.com'}>`,
      to: targetEmail,
      subject: `🛍️ New Order #${order._id.toString().slice(-6).toUpperCase()} - ₦${Number(order.totalAmount).toLocaleString()} (${order.customerName})`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #1f2937, #111827); padding: 25px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; color: #f59e0b; letter-spacing: 1px;">Shayors Cosmetics</h1>
            <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">New Store Order Notification</p>
          </div>
          
          <div style="padding: 24px;">
            <div style="background: #f9fafb; border-left: 4px solid #f59e0b; padding: 14px 16px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0; font-size: 15px; color: #374151;"><strong>Order ID:</strong> #${order._id.toString().slice(-6).toUpperCase()}</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #4b5563;">Placed on: ${new Date(order.createdAt || Date.now()).toLocaleString()}</p>
            </div>

            <h3 style="color: #111827; margin-bottom: 12px; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">Customer Information</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <tr><td style="padding: 6px 0; color: #6b7280; width: 140px;">Customer Name:</td><td style="padding: 6px 0; font-weight: 600; color: #111827;">${order.customerName}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Email:</td><td style="padding: 6px 0; color: #111827;">${order.customerEmail || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Phone:</td><td style="padding: 6px 0; color: #111827;">${order.customerPhone || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Shipping Address:</td><td style="padding: 6px 0; color: #111827;">${order.shippingAddress || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Payment Method:</td><td style="padding: 6px 0;"><span style="background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">${order.paymentMethod}</span></td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Payment Status:</td><td style="padding: 6px 0;"><span style="background: ${order.paymentStatus === 'paid' ? '#d1fae5' : '#fee2e2'}; color: ${order.paymentStatus === 'paid' ? '#065f46' : '#991b1b'}; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">${(order.paymentStatus || 'unpaid').toUpperCase()}</span></td></tr>
              ${order.paymentReference ? `<tr><td style="padding: 6px 0; color: #6b7280;">Paystack Ref:</td><td style="padding: 6px 0; font-family: monospace; color: #111827;">${order.paymentReference}</td></tr>` : ''}
              ${order.receiptInfo ? `<tr><td style="padding: 6px 0; color: #6b7280;">Receipt Info:</td><td style="padding: 6px 0; color: #111827;">${order.receiptInfo}</td></tr>` : ''}
              ${order.notes ? `<tr><td style="padding: 6px 0; color: #6b7280;">Customer Notes:</td><td style="padding: 6px 0; color: #4b5563; font-style: italic;">${order.notes}</td></tr>` : ''}
            </table>

            <h3 style="color: #111827; margin-bottom: 12px; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <thead>
                <tr style="background: #f3f4f6; color: #374151; text-align: left;">
                  <th style="padding: 8px;">Product</th>
                  <th style="padding: 8px; text-align: center;">Qty</th>
                  <th style="padding: 8px; text-align: right;">Price</th>
                  <th style="padding: 8px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr style="background: #fffbeb;">
                  <td colspan="3" style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 15px; color: #92400e;">Total Amount:</td>
                  <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 17px; color: #b45309;">₦${Number(order.totalAmount).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <div style="background: #fff8e1; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; margin: 20px 0; text-align: left;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>Payment Verification Status:</strong> 
                ${order.paymentStatus === 'paid' 
                  ? '✅ Fully Paid Online via Paystack. Funds captured. You can fulfill this order.' 
                  : (order.paymentStatus === 'partly paid' 
                      ? '⚠️ Partially Paid. Please check receipt and confirm balance in Sales & Invoices.' 
                      : '⚠️ Unpaid / Bank Transfer. Please confirm payment receipt in Web Orders before shipping.')}
              </p>
            </div>

            <div style="text-align: center; margin: 28px 0 20px;">
              <a href="${process.env.FRONTEND_URL || 'https://www.shayorscosmestics.com'}/Inventory/inventory.html?module=orders" 
                 style="background: #d97706; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);">
                🔍 Open Web Orders & Notifications Module
              </a>
            </div>

            <div style="text-align: center; margin-top: 25px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">This email was automatically generated and sent to ${targetEmail} by Shayors Cosmetics Store.</p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order notification email sent successfully to ${targetEmail}`);

    // If customer email is valid, send them a confirmation receipt too
    if (order.customerEmail && order.customerEmail.includes('@')) {
      const customerMailOptions = {
        from: `"Shayors Cosmetics" <${process.env.EMAIL_USER || 'alaminlamina5@gmail.com'}>`,
        to: order.customerEmail,
        subject: `Order Confirmation #${order._id.toString().slice(-6).toUpperCase()} - Shayors Cosmetics`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #b45309;">Thank You For Your Order, ${order.customerName}!</h2>
            <p>Your order has been received and is being processed.</p>
            <p><strong>Order Number:</strong> #${order._id.toString().slice(-6).toUpperCase()}</p>
            <p><strong>Payment Status:</strong> ${order.paymentStatus === 'paid' ? 'Paid (Verified)' : 'Pending Verification'}</p>
            <p><strong>Total Amount:</strong> ₦${Number(order.totalAmount).toLocaleString()}</p>
            <h3>Items:</h3>
            <ul>
              ${(order.items || []).map(i => `<li>${i.productName} (x${i.quantity}) - ₦${(i.quantity * i.price).toLocaleString()}</li>`).join('')}
            </ul>
            <p>If you have any questions, reach out to us on WhatsApp or reply to this email.</p>
          </div>
        `
      };
      await transporter.sendMail(customerMailOptions).catch(e => console.error("Customer confirmation email error:", e.message));
    }
  } catch (error) {
    console.error('Email alert error:', error);
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res, next) => {
  try {
    let orderData = req.body;

    // Handle multipart/form-data (when receipt is uploaded)
    if (req.file) {
      if (typeof orderData.items === 'string') {
        orderData.items = JSON.parse(orderData.items);
      }
      if (typeof orderData.charges === 'string') {
        orderData.charges = JSON.parse(orderData.charges);
      }
      if (orderData.totalAmount) {
        orderData.totalAmount = Number(orderData.totalAmount);
      }
    }

    const { error } = validateOrder(orderData);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const order = new Order(orderData);

    // Verify receipt if provided
    if (req.file) {
      const verification = await verifyReceipt(req.file.buffer);
      if (!verification.valid) {
        return res.status(400).json({ 
          message: `Receipt verification failed: ${verification.message}. Please upload a valid bank receipt.` 
        });
      }
      order.receiptVerified = true;
      order.receiptInfo = `Verified ${verification.bank} receipt. Ref: ${verification.reference}`;
      // In a real production app, you would save req.file to a cloud storage like AWS S3
      // For now, we'll mark it as verified based on the memory buffer scan
    }
    
    // Decrement stock for each item in the order
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        if (product.stock >= item.quantity) {
          product.stock -= item.quantity;
          await product.save();
        } else {
          return res.status(400).json({ message: `Insufficient stock for product: ${product.name}` });
        }
      } else {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }
    }

    const createdOrder = await order.save();

    // Create debtor entry if not paid
    if (createdOrder.paymentStatus !== 'paid') {
      await Customer.create({
        name: createdOrder.customerName,
        contact: createdOrder.customerPhone || createdOrder.customerEmail || 'N/A',
        totalAmount: createdOrder.totalAmount,
        status: createdOrder.paymentStatus === 'partly paid' ? 'Partly Paid' : 'Unpaid',
        invoiceNo: `WEB-${createdOrder._id.toString().slice(-6).toUpperCase()}`,
        product: createdOrder.items.map(i => i.productName).join(', ')
      });
    }

    sendEmailAlert(createdOrder);
    res.status(201).json(createdOrder);
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const status = req.query.status ? { orderStatus: req.query.status } : {};

    const count = await Order.countDocuments({ ...status });
    const orders = await Order.find({ ...status })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({ orders, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      if (orderStatus) order.orderStatus = orderStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      const updatedOrder = await order.save();

      // If marked as paid or confirmed, remove from debtors
      if (updatedOrder.paymentStatus === 'paid' || updatedOrder.orderStatus === 'confirmed') {
        const invoiceNo = `WEB-${updatedOrder._id.toString().slice(-6).toUpperCase()}`;
        await Customer.deleteMany({ 
          $or: [
            { invoiceNo: invoiceNo },
            { name: updatedOrder.customerName, status: { $ne: 'Paid' } }
          ]
        });
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      await Order.findByIdAndDelete(req.params.id);
      res.json({ message: 'Order removed' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    next(error);
  }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
    });
  } catch (error) {
    next(error);
  }
};

const getPaystackKey = async (req, res) => {
  res.json({
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || ''
  });
};

const verifyPaystackPayment = async (req, res, next) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ message: 'Transaction reference is required' });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      // Mock / fallback acceptance if secret key is not set yet in environment
      return res.json({
        status: true,
        message: 'Paystack secret not set, reference accepted',
        data: { reference, status: 'success' }
      });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (data.status && data.data && data.data.status === 'success') {
      return res.json({ status: true, data: data.data });
    } else {
      return res.status(400).json({ status: false, message: data.message || 'Payment verification failed' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getDashboardSummary,
  getPaystackKey,
  verifyPaystackPayment
};
