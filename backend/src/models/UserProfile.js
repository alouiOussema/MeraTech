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
    required: false, // Optional now for Google Auth users
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  picture: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('UserProfile', UserProfileSchema);