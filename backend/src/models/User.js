const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  pinHash: {
    type: String,
    required: true,
  },
  bankAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
