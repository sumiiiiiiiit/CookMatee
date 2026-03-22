const Message = require('../models/Message');
const User = require('../models/User');

// GET /api/messages/conversations
// Returns a list of unique users that the current user has exchanged messages with
const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const messages = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }]
        }).sort({ timestamp: -1 });

        // Build a map of unique conversation partners
        const partnerIds = new Set();
        messages.forEach((msg) => {
            const otherId = msg.senderId.toString() === userId.toString()
                ? msg.receiverId.toString()
                : msg.senderId.toString();
            partnerIds.add(otherId);
        });

        const partners = await User.find({ _id: { $in: [...partnerIds] } }).select('_id name email');

        // Attach last message to each partner
        const conversations = partners.map((partner) => {
            const lastMsg = messages.find(
                (m) =>
                    m.senderId.toString() === partner._id.toString() ||
                    m.receiverId.toString() === partner._id.toString()
            );
            return { partner, lastMessage: lastMsg };
        });

        res.json({ success: true, conversations });
    } catch (error) {
        console.error('getConversations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/messages/:receiverId
// Returns full message history between current user and receiverId
const getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const { receiverId } = req.params;

        const messages = await Message.find({
            $or: [
                { senderId: userId, receiverId },
                { senderId: receiverId, receiverId: userId }
            ]
        })
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
