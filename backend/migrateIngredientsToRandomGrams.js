require('dotenv').config();
const mongoose = require('mongoose');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const db = mongoose.connection.db;
        const recipesCollection = db.collection('recipes');

        const recipes = await recipesCollection.find({}).toArray();
        let updatedCount = 0;

        for (const recipe of recipes) {
            let needsUpdate = false;
            let newIngredients = [];

            if (Array.isArray(recipe.ingredients)) {
                newIngredients = recipe.ingredients.map(ing => {
                    if (ing.quantity && ing.quantity === '1 serving') {
                        needsUpdate = true;
                        // Generate random quantity between 10 and 500 grams in multiples of 10
                        const randomGrams = Math.floor(Math.random() * 50 + 1) * 10;
                        return { ...ing, quantity: `${randomGrams}g` };
                    }
                    return ing;
                });
            }

            if (needsUpdate) {
                await recipesCollection.updateOne(
                    { _id: recipe._id },
                    { $set: { ingredients: newIngredients } }
                );
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} recipes with random grams.`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrate();
