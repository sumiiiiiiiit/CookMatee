const { google } = require('googleapis');
const { randomBytes } = require('crypto');
const oAuth2Client = require('./oauth');

const sendVerificationEmail = async (user) => {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const User = require('../models/User');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await User.findByIdAndUpdate(user._id, {
      otp: otp,
      otpExpires: expires,
    });

    // Correct raw email format (Gmail API requires this exact structure)
    const emailContent = [
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      `From: CookMate <${process.env.GMAIL_USER}>`,
      `To: ${user.email}`,
      `Subject: =?utf-8?B?${Buffer.from('Your CookMate Verification Code').toString('base64')}?=`,
      '',
      'Welcome to CookMate!',
      '',
      `Your verification code is: ${otp}`,
      'This code expires in 10 minutes.',
      'If you didn’t sign up, ignore this email.'
    ].join('\r\n');

    const encodedEmail = Buffer.from(emailContent, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    console.log(`Verification email sent to: ${user.email}`);
    console.log('Message ID:', res.data.id);
  } catch (err) {
    console.error('Gmail API send error:', err.message);
    if (err.message.includes('invalid_grant')) {
      console.error('CRITICAL: Refresh token is invalid or expired. Please visit /api/auth/get-new-token to re-authenticate.');
    }
    if (err.response?.data) {
      console.error('Full Google error:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
};

module.exports = { sendVerificationEmail };