const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getConversations, getMessages, getRecipeOwner, sendMessage } = require('../controllers/messageController');

// Get all conversations for current user
router.get('/conversations', protect, getConversations);

// Send a message via REST
router.post('/send', protect, sendMessage);


// Get recipe owner so frontend can initiate chat
// Must be defined BEFORE /:receiverId to avoid being caught by the wildcard
router.get('/recipe-owner/:recipeId', protect, getRecipeOwner);

// Get message history with a specific user
router.get('/:receiverId', protect, getMessages);

module.exports = router;
