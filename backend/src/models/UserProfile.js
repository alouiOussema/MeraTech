const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  clerkUserId: {
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
