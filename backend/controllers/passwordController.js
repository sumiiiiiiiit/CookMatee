const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');
const oAuth2Client = require('../utils/oauth');

exports.handleOAuthCallback = async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error('Google OAuth error:', error);
    return res.status(400).send(`Google error: ${error}`);
  }

  if (!code) {
    return res.status(400).send('No code received from Google');
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    console.log('--- NEW GMAIL TOKENS RECEIVED ---');
    console.log('Refresh Token:', tokens.refresh_token || 'Not provided (already authorized)');
    console.log('Copy the refresh token above into your .env file as GMAIL_REFRESH_TOKEN');

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px; line-height: 1.6;">
        <h1 style="color: #4CAF50;">Auth Successful!</h1>
        <p>Tokens have been received. Check your <b>backend terminal</b> to see the refresh token.</p>
        <div style="background: #f4f4f4; padding: 20px; border-radius: 10px; display: inline-block; text-align: left; margin-top: 20px;">
          <p><b>1.</b> Copy the refresh token from terminal</p>
          <p><b>2.</b> Update <code>GMAIL_REFRESH_TOKEN</code> in your <code>.env</code> file</p>
          <p><b>3.</b> Restart your backend server</p>
        </div>
        <p style="margin-top: 20px; color: #666;">You can close this window now.</p>
      </div>
    `);
  } catch (err) {
    console.error('Token exchange failed:', err.message);
    res.status(500).send('Authentication failed');
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click on the following link, or paste this into your browser to complete the process within 15 minutes of receiving it:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        body: message,
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      user.resetToken = undefined;
      user.resetTokenExpire = undefined;
      await user.save();
      console.error('Forgot Password Email Error:', err);
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
