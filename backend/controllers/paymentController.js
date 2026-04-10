const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Helper to generate eSewa v2 signature
const generateEsewaSignature = (secretKey, totalAmount, transactionUuid, productCode) => {
    const data = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    return crypto
        .createHmac('sha256', secretKey)
        .update(data)
        .digest('base64');
};

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

        const rawAmount = recipe.price || 1;
        const amount = parseFloat(rawAmount).toFixed(1); // Use one decimal as per recent v2 reports
        const transactionUuid = `${recipeId.slice(-6)}-${Date.now()}`;
        const productCode = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';
        const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';

        const signature = generateEsewaSignature(secretKey, amount, transactionUuid, productCode);

        // Record a PENDING transaction
        await Transaction.create({
            user: user.id,
            chef: recipe.user,
            recipe: recipe._id,
            amount: parseFloat(amount),
            transactionUuid: transactionUuid,
            status: 'PENDING'
        });

        res.status(200).json({
            success: true,
            payment_method: 'esewa',
            formData: {
                amount: amount,
                tax_amount: "0.0",
                total_amount: amount,
                transaction_uuid: transactionUuid,
                product_code: productCode,
                product_service_charge: "0.0",
                product_delivery_charge: "0.0",
                success_url: `${process.env.FRONTEND_URL}/payment-success?id=${recipeId}`,
                failure_url: `${process.env.FRONTEND_URL}/recipes/${recipeId}`,
                signed_field_names: "total_amount,transaction_uuid,product_code",
                signature: signature
            },
            gateway_url: process.env.ESEWA_GATEWAY_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to initiate eSewa payment',
            error: error.message
        });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { data: encodedData, recipeId: recipeIdFallback } = req.body;

        if (!encodedData) {
            return res.status(400).json({ success: false, message: 'Payment data is required for verification' });
        }

        const decodedString = Buffer.from(encodedData, 'base64').toString('utf-8');
        const paymentData = JSON.parse(decodedString);

        if (paymentData.status !== 'COMPLETE') {
            return res.status(400).json({ 
                success: false, 
                message: `Payment status is ${paymentData.status}`,
                status: paymentData.status 
            });
        }

        const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
        
        // eSewa v2 requires dynamically generating the signature string based on the provided signed_field_names
        const signedFieldNames = paymentData.signed_field_names.split(',');
        const signatureString = signedFieldNames.map(field => `${field}=${paymentData[field]}`).join(',');

        const expectedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(signatureString)
            .digest('base64');

        if (expectedSignature !== paymentData.signature) {
             return res.status(400).json({ success: false, message: 'Security verification failed: Signature mismatch' });
        }

        const recipeId = recipeIdFallback;
        if (!recipeId) {
             return res.status(400).json({ success: false, message: 'Recipe context lost.' });
        }

        // 1. Give access to user
        await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { purchasedRecipes: new mongoose.Types.ObjectId(recipeId) } }
        );

        const recipe = await Recipe.findById(recipeId);
        if (recipe) {
            const amountPaid = parseFloat(paymentData.total_amount.replace(/,/g, ''));

            // 2. Atomically update the Transaction record to COMPLETE.
            // By requiring status: 'PENDING' in the query, we guarantee this specific transaction
            // can only be resolved once, eliminating double-payout race conditions from rapid concurrent clicks.
            const updatedTransaction = await Transaction.findOneAndUpdate(
                { transactionUuid: paymentData.transaction_uuid, status: 'PENDING', user: req.user.id },
                { 
                    status: 'COMPLETE',
                    esewaData: paymentData
                },
                { new: true }
            );

            // 3. Only reward the chef if the transaction was strictly successfully updated from PENDING right now.
            if (updatedTransaction) {
                // Update Chef (Recipe Owner) earnings
                await User.findByIdAndUpdate(recipe.user, {
                    $inc: { earnings: amountPaid }
                });

                // Update Recipe's individual performance tracking
                await Recipe.findByIdAndUpdate(recipeId, {
                    $inc: { totalEarnings: amountPaid }
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Payment verified and chef earnings updated',
            data: paymentData
        });

    } catch (error) {
        console.error('eSewa verification error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Verification failed',
            error: error.message
        });
    }
};


exports.payWithWallet = async (req, res) => {
    try {
        const { recipeId } = req.body;
        const user = req.user;
        const recipe = await Recipe.findById(recipeId);

        if (!recipe) {
            return res.status(404).json({ success: false, message: 'Recipe not found' });
        }

        const currentUser = await User.findById(user.id);
        if (currentUser.purchasedRecipes.some(id => id && id.toString() === recipeId)) {
            return res.status(400).json({ success: false, message: 'Recipe already purchased' });
        }

        const price = recipe.price || 0;
        if (currentUser.earnings < price) {
            return res.status(400).json({ success: false, message: 'Insufficient balance in Chef Wallet' });
        }

        // 1. Deduct from buyer
        await User.findByIdAndUpdate(user.id, {
            $inc: { earnings: -price },
            $addToSet: { purchasedRecipes: recipe._id }
        });

        // 2. Add to chef (seller)
        await User.findByIdAndUpdate(recipe.user, {
            $inc: { earnings: price }
        });

        // 3. Update recipe performance
        await Recipe.findByIdAndUpdate(recipeId, {
            $inc: { totalEarnings: price }
        });

        // 4. Record transaction
        await Transaction.create({
            user: user.id,
            chef: recipe.user,
            recipe: recipe._id,
            amount: price,
            status: 'COMPLETE',
            payment_method: 'wallet',
            transactionUuid: `wallet-${recipeId.slice(-6)}-${Date.now()}`
        });

        res.status(200).json({
            success: true,
            message: 'Recipe unlocked successfully using Chef Wallet!'
        });

    } catch (error) {
        console.error('Wallet payment error:', error);
        res.status(500).json({ success: false, message: 'Failed to process wallet payment' });
    }
};
