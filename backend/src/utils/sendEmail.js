const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Validate required environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      'Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env file. '
      + 'For Gmail: Use an App Password (not your regular password) if 2FA is enabled.'
    );
  }

  // Validate email options
  if (!options.email || !options.subject) {
    throw new Error('Email and subject are required');
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: process.env.EMAIL_PASS.replace(/\s+/g, ''),
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"Shayors Cosmetics" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message || '',
      html: options.html || options.message,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${options.email}. Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.email}:`, error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

module.exports = sendEmail;
