require('dotenv').config();
const mongoose = require('mongoose');
const { calculateRecipeCalories } = require('./utils/calorieCalculator');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const db = mongoose.connection.db;
        const recipesCollection = db.collection('recipes');

        const recipes = await recipesCollection.find({}).toArray();
        let updatedCount = 0;

        for (const recipe of recipes) {
            const nutrition = calculateRecipeCalories(recipe.ingredients, recipe.cookingMethod || 'frying');
            
            await recipesCollection.updateOne(
                { _id: recipe._id },
                { $set: { 
                    calories: nutrition.calories,
                    protein: nutrition.protein,
                    carbs: nutrition.carbs,
                    fat: nutrition.fat
                } }
            );
            updatedCount++;
        }

        console.log(`Successfully updated ${updatedCount} recipes with calculated calories.`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrate();
