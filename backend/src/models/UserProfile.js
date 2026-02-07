const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  voicePinHash: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('UserProfile', UserProfileSchema);