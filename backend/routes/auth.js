const express = require('express');
const router = express.Router();
const oAuth2Client = require('../utils/oauth');

const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
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


// Helper route for initial Google OAuth setup (Dev only)
// Visits this to authorize the app and get a refresh token for the .env file
router.get('/google-setup', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', // Ensures we get a refresh token
    prompt: 'consent', // Forces Google to show the consent screen & always return a refresh token
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://mail.google.com/'
    ],

  });
  res.redirect(authUrl);
});

module.exports = router;
