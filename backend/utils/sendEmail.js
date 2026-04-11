const nodemailer = require('nodemailer');

/**
 * Common transporter creator for both verification and general emails
 */
const createTransporter = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_SMTP_KEY,
      },
      debug: true,
      logger: true
    });

    return transporter;
  } catch (error) {
    console.error('Error creating email transporter:', error.message);
    throw error;
  }
};

const sendVerificationEmail = async (user) => {
  try {
    const User = require('../models/User');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await User.findByIdAndUpdate(user._id, {
      otp: otp,
      otpExpires: expires,
    });

    const transporter = await createTransporter();

    const mailOptions = {
      from: 'CookMate <adhikarisumit777@gmail.com>',
      to: user.email,
      subject: 'Your CookMate Verification Code',
      text: `Welcome to CookMate!\r\n\r\nYour verification code is: ${otp}\r\nThis code expires in 10 minutes.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to: ${user.email}`);
    console.log('Message ID:', info.messageId);
  } catch (err) {
    console.error('Verification email send error:', err.message);
    throw err;
  }
};

const sendEmail = async ({ to, subject, body }) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: 'CookMate <adhikarisumit777@gmail.com>',
      to: to,
      subject: subject,
      text: body,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${to}`);
    console.log('Message ID:', info.messageId);
  } catch (err) {
    console.error('General email send error:', err.message);
    throw err;
  }
};

module.exports = { sendVerificationEmail, sendEmail };