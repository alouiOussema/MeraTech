const mongoose = require('mongoose');

const TransferSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true,
    index: true,
  },
  toName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Transfer', TransferSchema);
