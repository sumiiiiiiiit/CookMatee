const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const axios = require('axios');

exports.initiatePayment = async (req, res) => {
    try {
        const { recipeId } = req.body;
        const user = req.user;

        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({ success: false, message: 'Recipe not found' });
        }

        if (user.purchasedRecipes.some(id => id && id.toString() === recipeId)) {
            return res.status(400).json({ success: false, message: 'Recipe already purchased' });
        }

        const amount = Math.round((recipe.price || 1) * 100);
        const txnId = `ORD${Date.now()}`;

        const payload = {
            return_url: `${process.env.FRONTEND_URL}/payment-success`,
            website_url: process.env.FRONTEND_URL,
            amount,
            purchase_order_id: txnId,
            purchase_order_name: "Recipe"
        };

        const response = await axios.post(process.env.KHALTI_GATEWAY_URL, payload, {
            headers: {
                'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json({
            success: true,
            payment_url: response.data.payment_url,
            pidx: response.data.pidx
        });

    } catch (error) {
        console.error('Payment initiation error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Payment initiation failed',
            error: error.response?.data || error.message
        });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { pidx, recipeId: recipeIdFallback } = req.body;

        if (!pidx) {
            return res.status(400).json({ success: false, message: 'pidx is required' });
        }

        await new Promise(resolve => setTimeout(resolve, 1500));

        let response;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            attempts++;
            response = await axios.post(process.env.KHALTI_VERIFY_URL, { pidx }, {
                headers: {
                    'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const currentStatus = (response.data.status || '').toLowerCase();

            if (currentStatus === 'completed' || currentStatus === 'success') {
                break;
            }

            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        const finalStatus = (response.data.status || '').toLowerCase();

        if (finalStatus === 'completed' || finalStatus === 'success') {
            let recipeId = recipeIdFallback;

            if (!recipeId || recipeId.length !== 24) {
                const khaltiOrderId = response.data.purchase_order_id || '';
                const match = khaltiOrderId.match(/[0-9a-fA-F]{24}/);
                if (match) recipeId = match[0];
            }

            if (!recipeId || recipeId.length !== 24) {
                return res.status(400).json({ success: false, message: 'Invalid recipe identifier' });
            }

            await User.findByIdAndUpdate(
                req.user.id,
                { $addToSet: { purchasedRecipes: new mongoose.Types.ObjectId(recipeId) } }
            );

            await User.findByIdAndUpdate(
                req.user.id,
                { $pull: { purchasedRecipes: null } }
            );

            return res.status(200).json({
                success: true,
                message: 'Payment verified and recipe unlocked',
                data: response.data
            });
        }

        return res.status(400).json({
            success: false,
            message: `Payment status is ${response.data.status}.`,
            status: response.data.status,
        });

    } catch (error) {
        console.error('Payment verification error:', error.response ? error.response.data : error.message);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.response ? error.response.data : error.message
        });
    }
};
