const express = require('express');
const router = express.Router();
const { searchRecipes } = require('../controllers/searchController');

/**
 * @desc    Search recipes using AI engine
 * @route   GET /api/search
 * @access  Public
 */
router.get('/', searchRecipes);

module.exports = router;
