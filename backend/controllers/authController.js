const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const { sendVerificationEmail } = require('../utils/sendEmail');
const oAuth2Client = require('../utils/oauth'); // Import OAuth client

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
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
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
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

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password
    console.log('--- Login Debug Start ---');
    console.log('Login attempt for email:', email);
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
    console.log('User found:', user.email, 'Verified:', user.isVerified);

    // Check if email is verified
    if (!user.isVerified) {
      console.log('Login failed: User not verified');
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox (or request resend).',
      });
    }

    // Verify password
    console.log('Comparing passwords...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    console.log('Generating token...');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // Set cookie
    console.log('Setting cookie and sending response...');
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    console.log('Login successful for:', user.email);
    console.log('--- Login Debug End ---');
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    console.log('Fetching profile for user ID:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, profilePicture } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const nameChanged = name && name !== user.name;

    // Update only provided fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    // If name changed, sync with all recipes
    if (nameChanged) {
      try {
        // 1. Update chefName in all recipes created by this user
        await Recipe.updateMany(
          { user: user._id },
          { chefName: name }
        );
        // 2. Update userName in all comments made by this user
        // Using arrayFilters to match only the comments of this specific user
        await Recipe.updateMany(
          { "comments.user": user._id },
          { $set: { "comments.$[elem].userName": name } },
          { arrayFilters: [{ "elem.user": user._id }] }
        );
      } catch (syncError) {
        console.error('Error syncing name change to recipes:', syncError);
       
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Public
exports.logoutUser = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Handle Google OAuth callback
// @route   GET /oauth2callback
// @access  Public
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

    // Log tokens for debugging/setup
    console.log('--- OAuth Tokens Received ---');
    console.log(JSON.stringify(tokens, null, 2));

    if (tokens.refresh_token) {
      console.log('IMPORTANT: New refresh token received. Save this to your .env file!');
      console.log(tokens.refresh_token);
    }

    oAuth2Client.setCredentials(tokens);

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h1>Auth Successful!</h1>
        <p>Tokens have been logged to the server terminal.</p>
        <p>You can close this window now.</p>
      </div>
    `);
  } catch (err) {
    console.error('Token exchange failed:', err.message);
    res.status(500).send('Authentication failed');
  }
};