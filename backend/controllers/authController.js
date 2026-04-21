const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/sendEmail');

const getCookieOptions = () => {
  const isLive = process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost');
  return {
    httpOnly: true,
    secure: isLive || process.env.NODE_ENV === 'production',
    sameSite: isLive || process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one digit' });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (!user.isVerified) {
        await sendVerificationEmail(user);
        return res.status(200).json({ success: true, message: 'Verification email resent. Please check your inbox.' });
      }
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    user = await User.create({ name, email, password, isVerified: false, role: 'user' });
    await sendVerificationEmail(user);

    res.status(201).json({
      success: true,
      message: 'Registered successfully! Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  try {
    const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
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
      return res.status(401).json({ success: false, message: 'Invalid email' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const cookieOptions = getCookieOptions();

    res.cookie('token', token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.cookie('isLoggedIn', 'true', {
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
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
        allergies: user.allergies || [],
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('purchasedRecipes', '_id title');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.purchasedRecipes?.some((id) => id === null)) {
      user.purchasedRecipes = user.purchasedRecipes.filter((id) => id !== null);
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
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (req.body.name) user.name = req.body.name;
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
        allergies: user.allergies,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.logoutUser = async (req, res) => {
  const cookieOptions = getCookieOptions();
  const expires = new Date(Date.now() + 10 * 1000);

  res.cookie('token', 'none', { ...cookieOptions, expires });
  res.cookie('isLoggedIn', 'false', { secure: cookieOptions.secure, sameSite: cookieOptions.sameSite, expires });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};