const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const { sendVerificationEmail } = require('../utils/sendEmail');


exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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
      role: 'user',
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