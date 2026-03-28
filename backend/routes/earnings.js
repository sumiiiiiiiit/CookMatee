const express = require('express');
const router = express.Router();
const { getChefEarnings } = require('../controllers/earningController');
const { protect } = require('../middleware/auth');

router.get('/my-earnings', protect, getChefEarnings);

module.exports = router;
