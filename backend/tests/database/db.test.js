const mongoose = require('mongoose');
const User = require('../../models/User');
const Recipe = require('../../models/Recipe');
const dbHandler = require('../db-helper');

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Database: Model Schema Validation', () => {

    // UT-21: User model hashing verification
    // Ensuring that the User model correctly hashes passwords before saving to the database.
    it('UT-21: should correctly save a valid user with password hashing', async () => {
        const userData = {
            name: 'DB Test User',
            email: 'db_test@example.com',
            password: 'secure_password'
        };
        const user = await User.create(userData);
        expect(user.password).not.toBe(userData.password); // Bcrypt check
        expect(user.email).toBe(userData.email);
    });

    // UT-22: Recipe schema validation (Required fields)
    // Verifying that the database prevents creating incomplete recipe entries.
    it('UT-22: should prevent saving recipes without a title', async () => {
        const recipe = new Recipe({
            category: 'Lunch',
            user: new mongoose.Types.ObjectId()
        });

        let err;
        try {
            await recipe.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.title).toBeDefined();
    });
});

