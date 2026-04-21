const Recipe = require('../models/Recipe');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { detectAllergens } = require('../utils/allergenDetector');
const axios = require('axios');

exports.likeRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const isLiked = recipe.likes.includes(req.user.id);
    if (isLiked) {
      recipe.likes = recipe.likes.filter((id) => id && id.toString() !== req.user.id.toString());
    } else {
      recipe.likes.push(req.user.id);
    }

    await recipe.save();
    res.status(200).json({ success: true, likesCount: recipe.likes.length, isLiked: !isLiked });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.commentOnRecipe = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Comment text is required' });

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    recipe.comments.push({ user: req.user.id, userName: req.user.name, text });
    await recipe.save();
    res.status(200).json({ success: true, comments: recipe.comments });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.saveRecipe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recipeId = req.params.id;

    const isSaved = user.savedRecipes.some((id) => id && id.toString() === recipeId.toString());
    if (isSaved) {
      user.savedRecipes = user.savedRecipes.filter((id) => id && id.toString() !== recipeId.toString());
    } else {
      user.savedRecipes.push(recipeId);
    }

    await user.save();
    res.status(200).json({ success: true, isSaved: !isSaved });
  } catch (error) {
    console.error('Save recipe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Recipe.aggregate([
      { $match: { status: { $regex: /^approved$/i } } },
      { $addFields: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
      { $sort: { likesCount: -1, createdAt: -1 } },
      { $limit: 10 },
      { $project: { title: 1, chefName: 1, likesCount: 1, category: 1 } },
    ]);
    res.status(200).json({ success: true, leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.purchaseRecipe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recipeId = req.params.id;

    if (user.purchasedRecipes.some((id) => id && id.toString() === recipeId)) {
      return res.status(200).json({ success: true, message: 'Already purchased' });
    }

    const recipe = await Recipe.findById(recipeId);
    if (recipe && !recipe.isPremium) {
      user.purchasedRecipes.push(recipeId);
      await user.save();
      return res.status(200).json({ success: true, message: 'Free recipe unlocked' });
    }

    const completedTransaction = await Transaction.findOne({
      user: req.user.id,
      recipe: recipeId,
      status: 'COMPLETE',
    });

    if (!completedTransaction) {
      return res.status(403).json({ success: false, message: 'Payment required. Please complete payment first.' });
    }

    user.purchasedRecipes.push(recipeId);
    await user.save();
    res.status(200).json({ success: true, message: 'Recipe unlocked successfully' });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllergensForRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const user = await User.findById(req.user.id);
    if (!user?.allergies?.length) return res.status(200).json({ success: true, allergens: [] });

    const detected = await detectAllergens(recipe.ingredients);
    const filtered = detected.filter((a) =>
      user.allergies.some((userAllergy) => userAllergy.toLowerCase() === a.allergen.toLowerCase())
    );

    res.status(200).json({ success: true, allergens: filtered });
  } catch (error) {
    console.error('Allergen detection error:', error);
    res.status(500).json({ success: false, message: 'Failed to detect allergens' });
  }
};

exports.searchRecipesAI = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json({ success: true, recipes: [] });

    const serviceUrl = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:5005/search';

    try {
      const response = await axios.get(serviceUrl, { params: { q }, timeout: 5000 });
      res.status(200).json({
        success: true,
        count: response.data?.length || 0,
        recipes: response.data || [],
      });
    } catch (err) {
      console.error('Python AI Service Error:', err.message);
      res.status(503).json({ success: false, message: 'AI Search service unavailable.' });
    }
  } catch (error) {
    console.error('searchRecipesAI error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getRelatedRecipes = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    let related = await Recipe.find({
      _id: { $ne: req.params.id },
      category: recipe.category,
      status: 'approved',
    }).limit(3);

    if (related.length < 3) {
      const extra = await Recipe.find({
        _id: { $ne: req.params.id, $nin: related.map((r) => r._id) },
        status: 'approved',
      }).limit(3 - related.length);
      related = related.concat(extra);
    }

    res.status(200).json({ success: true, recipes: related });
  } catch (error) {
    console.error('Related recipes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
