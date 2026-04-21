/**
 * Financial Core Tests (Payments & Earnings)
 * Making sure users can pay for recipes and chefs actually get their money.
 * Includes eSewa verification simulation.
 */
const request = require('supertest');
const { app } = require('../../app');
const dbHandler = require('../db-helper');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const Recipe = require('../../models/Recipe');
const jwt = require('jsonwebtoken');

// Constant for easy reference
const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

let user, chef, recipe, token;

beforeAll(async () => {
    await dbHandler.connect();
    // Setting up a buyer and a seller
    user = await User.create({ name: 'The Buyer', email: 'buy@example.com', password: 'password123', isVerified: true });
    chef = await User.create({ name: 'Master Chef', email: 'chef@example.com', password: 'password123', isVerified: true });
    
    // Creating a premium recipe to buy
    recipe = await Recipe.create({ 
        title: 'Premium Steaks', 
        category: 'Dinner', 
        user: chef._id, 
        chefName: 'Master Chef', 
        ingredients: [{name:'Steak', quantity:'1'}], 
        steps: 'Grill it.', 
        difficulty: 1, 
        cookingTime: '20', 
        isPremium: true, 
        price: 150 
    });
    
    token = jwt.sign({ id: user._id }, JWT_SECRET);
});
afterAll(async () => await dbHandler.closeDatabase());

describe('Financial Transactions & Wallet Updates', () => {

    // UT-08: Initiate eSewa payment request
    // Verifying that the system correctly generates the signed payment form for eSewa.
    it('UT-08: Initiate eSewa payment request', async () => {
        const res = await request(app)
            .post('/api/payment/initiate')
            .set('Authorization', `Bearer ${token}`)
            .send({ recipeId: recipe._id });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.formData).toBeDefined();
        expect(res.body.formData.amount).toBe("150");
    });

    // UT-09: Verify eSewa payment and update Chef balance
    // Successfully verifying an eSewa transaction and making sure the chef gets paid.
    it('UT-09: Verify eSewa payment and update Chef balance', async () => {
        const amount = "150";
        const txUuid = 'TRANS-001';
        const productCode = 'EPAYTEST';
        const secretKey = '8gBm/:&EnhH.1/q';

        const trans = await Transaction.create({
            user: user._id, chef: chef._id, recipe: recipe._id, amount: 150, transactionUuid: txUuid, status: 'PENDING'
        });

        // Match controller logic for signature
        const signatureString = `total_amount=${amount},transaction_uuid=${txUuid},product_code=${productCode}`;
        const signature = require('crypto')
            .createHmac('sha256', secretKey)
            .update(signatureString)
            .digest('base64');

        const payData = Buffer.from(JSON.stringify({
            status: 'COMPLETE',
            total_amount: amount,
            transaction_uuid: txUuid,
            product_code: productCode,
            signed_field_names: 'total_amount,transaction_uuid,product_code',
            signature: signature
        })).toString('base64');


        const res = await request(app)
            .post('/api/payment/verify')
            .set('Authorization', `Bearer ${token}`)
            .send({ data: payData });

        expect(res.statusCode).toEqual(200);
        
        const updatedChef = await User.findById(chef._id);
        expect(updatedChef.earnings).toBe(150);
    });

    // UT-10: Payment fail due to invalid eSewa status
    // Checking how we handle FAILED or CANCELED responses from the payment gateway.
    it('UT-10: Payment fail due to invalid eSewa status', async () => {
        const payData = Buffer.from(JSON.stringify({ 
            status: 'CANCELED', 
            transaction_uuid: 'TRANS-BAD' 
        })).toString('base64');
        
        const res = await request(app)
            .post('/api/payment/verify')
            .set('Authorization', `Bearer ${token}`)
            .send({ data: payData });
            
        expect(res.statusCode).toBe(400);
    });



    // UT-11: Check Wallet Balance reflects total earnings
    // Basic check to ensure the chef's earnings are readable from their profile.
    it('UT-11: Check Wallet Balance reflects total earnings', async () => {
        const chefProfile = await User.findById(chef._id);
        expect(chefProfile.earnings).toBeGreaterThanOrEqual(150);
    });
});


