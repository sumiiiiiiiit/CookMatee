const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_USER,
      pass: process.env.BREVO_SMTP_KEY,
    },
  });
};

const sendVerificationEmail = async (user) => {
  const User = require('../models/User');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000;

  await User.findByIdAndUpdate(user._id, { otp, otpExpires: expires });

  const transporter = createTransporter();
  await transporter.sendMail({
    from: 'CookMate <adhikarisumit777@gmail.com>',
    to: user.email,
    subject: 'Your CookMate Verification Code',
    text: `Welcome to CookMate!\n\nYour verification code is: ${otp}\nThis code expires in 10 minutes.`,
  });
};

const sendEmail = async ({ to, subject, body }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: 'CookMate <adhikarisumit777@gmail.com>',
    to,
    subject,
    text: body,
  });
};

module.exports = { sendVerificationEmail, sendEmail };