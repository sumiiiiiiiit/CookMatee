const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'snorkmaidennnn34@gmail.com' });
        if (!user) {
            console.log('User not found');
            return;
        }
        console.log('User found:', user.name);
        console.log('Purchased Recipes:', user.purchasedRecipes);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
