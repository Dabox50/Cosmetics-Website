const express = require('express');
const router = express.Router();
const sendEmail = require('../utils/sendEmail');

// @desc    Submit contact message and notify store owner
// @route   POST /api/contact
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    const recipient = process.env.ADMIN_EMAIL || 'shayorscosmestics@gmail.com';
    const inquiryType = subject || 'General Inquiry';
    const customerPhone = phone ? phone.trim() : 'Not provided';

    const htmlContent = `
      <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #03140b; color: #eafaf1; border: 1px solid rgba(212,175,55,0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #0e261a, #04140c); padding: 30px 24px; text-align: center; border-bottom: 1px solid rgba(212,175,55,0.3);">
          <h1 style="margin: 0; font-size: 24px; color: #d4af37; letter-spacing: 2px; text-transform: uppercase;">Shayors Cosmetics</h1>
          <p style="margin: 8px 0 0; font-size: 13px; color: #7affbf; letter-spacing: 1px;">✦ NEW CONCIERGE INQUIRY RECEIVED ✦</p>
        </div>

        <div style="padding: 28px 24px;">
          <div style="background: rgba(52,232,154,0.08); border-left: 4px solid #d4af37; padding: 14px 18px; margin-bottom: 24px; border-radius: 6px;">
            <p style="margin: 0; font-size: 15px; color: #ffffff;"><strong>Inquiry Type:</strong> ${inquiryType}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #a3cbb5;">Received on: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })} (WAT)</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
              <td style="padding: 10px 0; color: #7affbf; width: 140px; font-weight: 600;">Client Name:</td>
              <td style="padding: 10px 0; color: #ffffff; font-weight: 700;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
              <td style="padding: 10px 0; color: #7affbf; font-weight: 600;">Email Address:</td>
              <td style="padding: 10px 0; color: #ffffff;"><a href="mailto:${email}" style="color: #d4af37; text-decoration: none;">${email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
              <td style="padding: 10px 0; color: #7affbf; font-weight: 600;">Phone Number:</td>
              <td style="padding: 10px 0; color: #ffffff;">${customerPhone}</td>
            </tr>
          </table>

          <div style="margin-top: 10px; margin-bottom: 28px;">
            <h3 style="color: #d4af37; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Client Message:</h3>
            <div style="background: rgba(0,0,0,0.45); border: 1px solid rgba(52,232,154,0.2); border-radius: 10px; padding: 18px; color: #f0fdf4; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="mailto:${email}?subject=Re:%20${encodeURIComponent(inquiryType)}%20-%20Shayors%20Cosmetics" style="display: inline-block; background: linear-gradient(135deg, #d4af37, #b89324); color: #02160c; font-weight: 700; text-transform: uppercase; font-size: 13px; letter-spacing: 1.5px; padding: 12px 28px; border-radius: 50px; text-decoration: none; box-shadow: 0 4px 15px rgba(212,175,55,0.4);">
              Reply Directly to Client →
            </a>
          </div>
        </div>

        <div style="background: rgba(2,16,10,0.9); padding: 16px; text-align: center; font-size: 11px; color: #6ee7b7; border-top: 1px solid rgba(255,255,255,0.06);">
          Shayors Cosmetics · Official Web Concierge System
        </div>
      </div>
    `;

    await sendEmail({
      email: recipient,
      subject: `📩 New Message from ${name} [${inquiryType}]`,
      message: `New message from ${name} (${email}, Phone: ${customerPhone}):\n\nInquiry Type: ${inquiryType}\n\nMessage:\n${message}`,
      html: htmlContent
    });

    res.status(200).json({
      success: true,
      message: 'Your message has been sent to our concierge team at Shayors Cosmetics.'
    });
  } catch (error) {
    console.error('Contact form email failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to deliver message via email. Please reach out via WhatsApp.'
    });
  }
});

module.exports = router;
