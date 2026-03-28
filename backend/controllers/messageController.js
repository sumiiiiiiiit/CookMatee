const Message = require('../models/Message');
const User = require('../models/User');

// GET /api/messages/conversations
// Returns a list of unique conversations that the current user has exchanged messages with (separated by recipe)
const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const messages = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }]
        }).sort({ timestamp: -1 }).populate({
            path: 'recipeId',
            select: 'title image _id user' // Include user (chef's ID)
        });

        const conversationsMap = new Map();

        messages.forEach((msg) => {
            const partnerId = msg.senderId.toString() === userId.toString()
                ? msg.receiverId.toString()
                : msg.senderId.toString();
            
            const recipeIdStr = msg.recipeId ? msg.recipeId._id.toString() : 'no-recipe';
            const convKey = `${partnerId}_${recipeIdStr}`;

            if (!conversationsMap.has(convKey)) {
                conversationsMap.set(convKey, {
                    partnerId,
                    recipe: msg.recipeId,
                    lastMessage: msg
                });
            }
        });

        const partnerIds = Array.from(new Set(Array.from(conversationsMap.values()).map(c => c.partnerId)));
        const partners = await User.find({ _id: { $in: partnerIds } }).select('_id name email');

        const conversations = Array.from(conversationsMap.values()).map((conv) => {
            const partner = partners.find(p => p._id.toString() === conv.partnerId);
            return {
                partner,
                recipe: conv.recipe || null,
                lastMessage: conv.lastMessage
            };
        }).filter(c => c.partner);

        // Sort conversations by timestamp descending
        conversations.sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));

        res.json({ success: true, conversations });
    } catch (error) {
        console.error('getConversations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/messages/:receiverId
// Returns full message history between current user and receiverId, optionally filtered by recipeId
const getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const { receiverId } = req.params;
        const { recipeId } = req.query;

        const matchQuery = {
            $or: [
                { senderId: userId, receiverId },
                { senderId: receiverId, receiverId: userId }
            ]
        };

        if (recipeId && recipeId !== 'null' && recipeId !== 'undefined') {
            matchQuery.recipeId = recipeId;
        } else {
            matchQuery.recipeId = null; // matches missing or explicitly null
        }

        const messages = await Message.find(matchQuery)
            .sort({ timestamp: 1 })
            .populate('senderId', 'name')
            .populate('receiverId', 'name');

        res.json({ success: true, messages });
    } catch (error) {
        console.error('getMessages error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/messages/user/:recipeId
// Returns the recipe owner so frontend can start a chat with them
const getRecipeOwner = async (req, res) => {
    try {
        const Recipe = require('../models/Recipe');
        const recipe = await Recipe.findById(req.params.recipeId).populate('user', '_id name');
        if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
        res.json({ success: true, owner: recipe.user });
    } catch (error) {
        console.error('getRecipeOwner error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getConversations, getMessages, getRecipeOwner };
