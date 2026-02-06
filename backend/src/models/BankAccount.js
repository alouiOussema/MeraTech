const mongoose = require('mongoose');

const BankAccountSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true,
    index: true,
  },
  balance: {
    type: Number,
    default: 250,
  },
  currency: {
    type: String,
    default: 'TND',
  },
}, { timestamps: true });

module.exports = mongoose.model('BankAccount', BankAccountSchema);
