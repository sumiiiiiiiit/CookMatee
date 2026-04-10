const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    transactionUuid: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETE', 'FAILED'],
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        default: 'esewa'
    },
    esewaData: {
        type: Object
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
