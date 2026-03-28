const Recipe = require('../models/Recipe');
const User = require('../models/User');

exports.getChefEarnings = async (req, res) => {
    try {
        const chefId = req.user.id;

        // 1. Get all premium recipes created by this chef
        const recipes = await Recipe.find({ user: chefId, isPremium: true });

        if (!recipes || recipes.length === 0) {
            return res.status(200).json({
                success: true,
                totalBalance: 0,
                recipes: [],
                weeklyData: [0, 0, 0, 0, 0, 0, 0], // Sun to Sat
                breakdown: []
            });
        }

        const recipeIds = recipes.map(r => r._id);

        // 2. Count sales for these recipes
        // We find all users who have any of these recipe IDs in their purchasedRecipes array
        const purchasers = await User.find({
            purchasedRecipes: { $in: recipeIds }
        }).select('purchasedRecipes');

        // Create a map to count sales per recipe
        const salesMap = {};
        recipeIds.forEach(id => salesMap[id.toString()] = 0);

        purchasers.forEach(buyer => {
            buyer.purchasedRecipes.forEach(pId => {
                if (salesMap[pId.toString()] !== undefined) {
                    salesMap[pId.toString()]++;
                }
            });
        });

        // 3. Calculate breakdown and total
        let totalBalance = 0;
        const recipeStats = recipes.map(recipe => {
            const salesCount = salesMap[recipe._id.toString()] || 0;
            const revenue = salesCount * (recipe.price || 0);
            totalBalance += revenue;

            return {
                _id: recipe._id,
                title: recipe.title,
                image: recipe.image,
                price: recipe.price,
                salesCount,
                revenue
            };
        });

        // Mocking weekly data and breakdown for the UI prototype
        // In a real app, we'd have a Transactions model to track exact dates
        // If balance is 0, show a flat line.
        const weeklyData = totalBalance > 0 ? [1200, 2100, 1800, 3500, 2900, 4200, totalBalance] : [0, 0, 0, 0, 0, 0, 0]; 
        
        const breakdown = [
            { name: 'Direct Sales', value: 75, color: '#8b5cf6', revenue: totalBalance * 0.75 },
            { name: 'Subscription Share', value: 15, color: '#10b981', revenue: totalBalance * 0.15 },
            { name: 'Promotions', value: 10, color: '#f59e0b', revenue: totalBalance * 0.10 }
        ];

        res.status(200).json({
            success: true,
            totalBalance,
            recipes: recipeStats,
            weeklyData,
            breakdown
        });

    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch earnings' });
    }
};
