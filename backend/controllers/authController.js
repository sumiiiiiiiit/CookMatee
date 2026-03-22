const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const { sendVerificationEmail, sendEmail } = require('../utils/sendEmail');
const oAuth2Client = require('../utils/oauth'); // Import OAuth client

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    if (!/\d/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one digit',
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // If exists but not verified → resend verification email
      if (!user.isVerified) {
        await sendVerificationEmail(user);
        return res.status(200).json({
          success: true,
          message: 'Verification email resent. Please check your inbox.',
        });
      }
      // If already verified → normal duplicate error
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create user (not verified yet)
    user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      role: role === 'admin' ? 'admin' : 'user',
    });

    // Send verification email
    await sendVerificationEmail(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully! Please check your email to verify your account.',
      // Do NOT send token here — user must verify first
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Check if it's an email-related error
    if (error.message && (error.message.includes('invalid_grant') || error.message.includes('auth'))) {
      return res.status(500).json({
        success: false,
        message: 'Account created, but verification email failed to send. Please contact the administrator to manualy verify your account or try again later.',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};


exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required',
    });
  }

  try {
    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code',
      });
    }

    // Mark as verified and clean up OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification',
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Add a non-httpOnly cookie for frontend auth checks
    res.cookie('isLoggedIn', 'true', {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        purchasedRecipes: user.purchasedRecipes || [],
        savedRecipes: user.savedRecipes || [],
        allergies: user.allergies || []
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('purchasedRecipes', '_id title');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.purchasedRecipes?.some(id => id === null)) {
      user.purchasedRecipes = user.purchasedRecipes.filter(id => id !== null);
      await user.save();
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (req.body.allergies !== undefined) user.allergies = req.body.allergies;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        allergies: user.allergies
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.logoutUser = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.cookie('isLoggedIn', 'false', {
    expires: new Date(Date.now() + 10 * 1000),
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

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

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Set token and expiry
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000; // 15 mins

    await user.save();

    // Create reset url
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

    // Set new password (it will be hashed by userSchema.pre('save'))
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