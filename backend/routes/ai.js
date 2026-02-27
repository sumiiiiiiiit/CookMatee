const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// We use protect middleware to ensure only logged-in users can use the chatbot
router.post('/chat', protect, chatWithAI);

module.exports = router;
