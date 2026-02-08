const mongoose = require('mongoose');

const BankAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 200, // Default start balance
  },
  currency: {
    type: String,
    default: 'TND',
  },
}, { timestamps: true });

module.exports = mongoose.model('BankAccount', BankAccountSchema);
