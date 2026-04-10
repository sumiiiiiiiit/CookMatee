const Recipe = require('../models/Recipe');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

exports.getChefEarnings = async (req, res) => {
    try {
        const chefId = req.user.id;

        // 1. Get the chef's total earnings directly from their profile
        const chef = await User.findById(chefId).select('earnings');
        const totalBalance = chef ? chef.earnings : 0;

        // 2. Get all premium recipes created by this chef with their total earnings
        const recipes = await Recipe.find({ user: chefId, isPremium: true });

        const recipeStats = await Promise.all(recipes.map(async (recipe) => {
            // Find all successful completed transactions for this recipe
            const transactions = await Transaction.find({
                recipe: recipe._id,
                status: 'COMPLETE'
            }).populate('user', 'name profilePicture');

            const purchasers = transactions.map(tx => ({
                id: tx.user ? tx.user._id : 'Unknown',
                name: tx.user ? tx.user.name : 'Unknown User',
                profilePicture: tx.user ? tx.user.profilePicture : null,
                date: tx.createdAt
            }));

            return {
                _id: recipe._id,
                title: recipe.title,
                image: recipe.image,
                price: recipe.price,
                salesCount: purchasers.length,
                purchasers: purchasers,
                revenue: recipe.totalEarnings || 0
            };
        }));

        // 3. Calculate actual weekly data (last 7 days)
        const weeklyData = [0, 0, 0, 0, 0, 0, 0];
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const recentTransactions = await Transaction.find({
            chef: chefId,
            status: 'COMPLETE',
            createdAt: { $gte: sevenDaysAgo, $lte: today }
        });

        recentTransactions.forEach(tx => {
            const txDate = new Date(tx.createdAt);
            // Calculate index (0 to 6) based on days ago
            const diffTime = Math.abs(today - txDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const index = 6 - diffDays;
            if (index >= 0 && index < 7) {
                weeklyData[index] += tx.amount;
            }
        });

        res.status(200).json({
            success: true,
            totalBalance,
            recipes: recipeStats,
            weeklyData,
            breakdown: [
                { name: 'Direct Sales', value: 100, color: '#8b5cf6', revenue: totalBalance }
            ]
        });

    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch earnings' });
    }
};

