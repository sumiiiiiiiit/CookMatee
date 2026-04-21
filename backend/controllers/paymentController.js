const crypto = require('crypto');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const generateSignature = (secretKey, totalAmount, transactionUuid, productCode) => {
  const data = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac('sha256', secretKey).update(data).digest('base64');
};

exports.initiatePayment = async (req, res) => {
  try {
    const { recipeId } = req.body;
    const user = req.user;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    if (user.purchasedRecipes.some((id) => id && id.toString() === recipeId)) {
      return res.status(400).json({ success: false, message: 'Recipe already purchased' });
    }

    const amount = (recipe.price || 1).toString();
    const transactionUuid = `${recipeId.slice(-6)}-${Date.now()}`;
    const productCode = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';
    const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
    const signature = generateSignature(secretKey, amount, transactionUuid, productCode);

    await Transaction.create({
      user: user.id,
      chef: recipe.user,
      recipe: recipe._id,
      amount: parseFloat(amount),
      transactionUuid,
      status: 'PENDING',
    });

    res.status(200).json({
      success: true,
      payment_method: 'esewa',
      formData: {
        amount,
        tax_amount: '0',
        total_amount: amount,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        product_service_charge: '0',
        product_delivery_charge: '0',
        success_url: `${process.env.FRONTEND_URL}/payment-success?id=${recipeId}`,
        failure_url: `${process.env.FRONTEND_URL}/recipes/${recipeId}`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature,
      },
      gateway_url: process.env.ESEWA_GATEWAY_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to initiate payment', error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { data: encodedData } = req.body;

    if (!encodedData) {
      return res.status(400).json({ success: false, message: 'Payment data is required' });
    }

    const paymentData = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8'));

    if (paymentData.status !== 'COMPLETE') {
      return res.status(400).json({ success: false, message: `Payment status is ${paymentData.status}` });
    }

    const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
    const signedFields = paymentData.signed_field_names.split(',');
    const signatureString = signedFields.map((f) => `${f}=${paymentData[f]}`).join(',');
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(signatureString).digest('base64');

    if (expectedSignature !== paymentData.signature) {
      return res.status(400).json({ success: false, message: 'Signature mismatch' });
    }

    const transaction = await Transaction.findOne({
      transactionUuid: paymentData.transaction_uuid,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const recipeId = transaction.recipe;
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { purchasedRecipes: recipeId } });

    const recipe = await Recipe.findById(recipeId);
    if (recipe) {
      const amountPaid = parseFloat(paymentData.total_amount.replace(/,/g, ''));

      const updated = await Transaction.findOneAndUpdate(
        { _id: transaction._id, status: 'PENDING' },
        { status: 'COMPLETE', esewaData: paymentData },
        { new: true }
      );

      if (updated) {
        await User.findByIdAndUpdate(recipe.user, { $inc: { earnings: amountPaid } });
        await Recipe.findByIdAndUpdate(recipeId, { $inc: { totalEarnings: amountPaid } });
      }
    }

    res.status(200).json({ success: true, message: 'Payment verified successfully', data: paymentData });
  } catch (error) {
    console.error('eSewa verification error:', error.message);
    res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
};

exports.payWithWallet = async (req, res) => {
  try {
    const { recipeId } = req.body;
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

    const currentUser = await User.findById(req.user.id);
    if (currentUser.purchasedRecipes.some((id) => id && id.toString() === recipeId)) {
      return res.status(400).json({ success: false, message: 'Already purchased' });
    }

    const price = recipe.price || 0;
    if (currentUser.earnings < price) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { earnings: -price },
      $addToSet: { purchasedRecipes: recipe._id },
    });

    await User.findByIdAndUpdate(recipe.user, { $inc: { earnings: price } });
    await Recipe.findByIdAndUpdate(recipeId, { $inc: { totalEarnings: price } });

    await Transaction.create({
      user: req.user.id,
      chef: recipe.user,
      recipe: recipe._id,
      amount: price,
      status: 'COMPLETE',
      payment_method: 'wallet',
      transactionUuid: `wallet-${recipeId.slice(-6)}-${Date.now()}`,
    });

    res.status(200).json({ success: true, message: 'Recipe unlocked using wallet balance!' });
  } catch (error) {
    console.error('Wallet payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to process wallet payment' });
  }
};
