const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
    getAllRecipes,
    getSavedRecipes,
    getMyRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
} = require('../controllers/recipeController');
const {
    getLeaderboard,
    likeRecipe,
    commentOnRecipe,
    saveRecipe,
    purchaseRecipe,
    getAllergensForRecipe,
    searchRecipesAI,
    getRelatedRecipes
} = require('../controllers/recipeInteractionController');

// Specific routes first
router.get('/leaderboard', getLeaderboard);
router.get('/saved', protect, getSavedRecipes);
router.get('/my-recipes', protect, getMyRecipes);

router.get('/search', searchRecipesAI);
router.get('/', getAllRecipes);

// Finally parameterized routes
router.get('/:id', getRecipeById);
router.get('/:id/related', getRelatedRecipes);
router.get('/:id/allergens', protect, getAllergensForRecipe);

// Protected action routes
router.post('/', protect, upload.single('image'), createRecipe);
router.put('/:id', protect, upload.single('image'), updateRecipe);
router.post('/:id/like', protect, likeRecipe);
router.post('/:id/comment', protect, commentOnRecipe);
router.post('/:id/save', protect, saveRecipe);
router.post('/:id/purchase', protect, purchaseRecipe);
router.delete('/:id', protect, deleteRecipe);

module.exports = router;
