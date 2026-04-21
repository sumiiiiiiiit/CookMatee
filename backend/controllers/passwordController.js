const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');

exports.handleOAuthCallback = (req, res) => res.status(404).send('Not available');

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    const message = `You requested a password reset. Click the link below within 15 minutes:\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`;

    try {
      await sendEmail({ to: user.email, subject: 'Password Reset Request', body: message });
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

    const user = await User.findOne({ resetToken: token, resetTokenExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

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
