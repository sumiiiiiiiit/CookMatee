const User = require('../models/User');
const Recipe = require('../models/Recipe');


exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.getAllRecipesAdmin = async (req, res) => {
    try {
        const recipes = await Recipe.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, recipes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateRecipeStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const recipe = await Recipe.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.status(200).json({ success: true, recipe });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const { sendEmail } = require('../utils/sendEmail');

exports.notifyUser = async (req, res) => {
    try {
        const { recipeId, message } = req.body;
        const recipe = await Recipe.findById(recipeId).populate('user');

        if (!recipe || !recipe.user) {
            return res.status(404).json({ success: false, message: 'Recipe or user not found' });
        }

        await sendEmail({
            to: recipe.user.email,
            subject: `Update on your recipe: ${recipe.title}`,
            body: `Hello Chef ${recipe.user.name},\n\nOur admin has a message for you regarding your recipe "${recipe.title}":\n\n${message}\n\nBest regards,\nCookMate Team`
        });

        res.status(200).json({ success: true, message: 'Notification sent' });
    } catch (error) {
        console.error('Notify Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteRecipeAdmin = async (req, res) => {
    try {
        await Recipe.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Recipe deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
