require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cookmate';

mongoose.connect(uri)
    .then(async () => {
        console.log(`Connected to DB: ${uri}`);
        
        // Reset all purchasedRecipes directly to []
        const result = await User.updateMany({}, { $set: { purchasedRecipes: [] } });
        console.log(`Successfully reset purchasedRecipes for ${result.modifiedCount} users.`);
        
        mongoose.disconnect();
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error connecting to DB or updating users:', error);
        process.exit(1);
    });
