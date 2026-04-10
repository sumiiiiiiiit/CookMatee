const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  verifyEmail,
} = require('../controllers/authController');
const { forgotPassword, resetPassword, handleOAuthCallback } = require('../controllers/passwordController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
// Email verification route
router.post('/verify-email', verifyEmail);
router.get('/logout', logoutUser);
// Protected routes (require authentication)
router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfile);


module.exports = router;
