const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['CHECKOUT', 'TRANSFER', 'TOPUP'],
    required: true,
  },
  amount: {
    type: Number, // Negative for checkout/transfer out, positive for topup
    required: true,
  },
  meta: {
    type: mongoose.Schema.Types.Mixed, // Can store cart summary or transfer details
    default: {},
  },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
