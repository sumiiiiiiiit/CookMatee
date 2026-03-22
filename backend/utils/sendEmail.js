const nodemailer = require('nodemailer');
const oAuth2Client = require('./oauth');

/**
 * Common transporter creator for both verification and general emails
 */
const createTransporter = async () => {
  try {
    // The oauth2Client already has credentials set at the global level in oauth.js
    // We can get the current access token
    const { token: accessToken } = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken,
      },
      debug: true, // Enable debug output
      logger: true  // Log to console
    });


    return transporter;
  } catch (error) {
    console.error('Error creating email transporter:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.error('CRITICAL: Refresh token is invalid or expired.');
      console.error('Please visit http://localhost:5001/api/auth/google-setup to re-authenticate.');
    }
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
      from: `CookMate <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: 'Your CookMate Verification Code',
      text: `Welcome to CookMate!\r\n\r\nYour verification code is: ${otp}\r\nThis code expires in 10 minutes.\r\nIf you didn’t sign up, ignore this email.`,
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
      from: `CookMate <${process.env.GMAIL_USER}>`,
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