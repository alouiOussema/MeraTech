const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const UserProfile = require('../models/UserProfile');
const { JWT_SECRET } = require('../middleware/auth');

// Validation schemas
const registerSchema = z.object({
  fullName: z.string().min(1, "الاسم لازم يكون موجود"),
  voicePin: z.string().length(6, "الـPIN لازم يكون 6 أرقام").regex(/^\d+$/, "الـPIN لازم يكون أرقام كهو")
});

const loginSchema = z.object({
  fullName: z.string().min(1, "الاسم لازم يكون موجود"), // Added fullName for identification
  voicePin: z.string().length(6, "الـPIN لازم يكون 6 أرقام")
});

// Helper to generate Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

// Register new profile
router.post('/register', async (req, res) => {
  try {
    const { fullName, voicePin } = registerSchema.parse(req.body);
    console.log(`[Register] Attempting to register: ${fullName}`);

    // Check if profile exists (by Name for simplicity in this demo)
    const existingUser = await UserProfile.findOne({ fullName });
    if (existingUser) {
      console.log(`[Register] User already exists: ${fullName}`);
      return res.status(409).json({ error: "USER_EXISTS", message: "هذا اليوزر موجود قبل" });
    }

    // Hash PIN
    const salt = await bcrypt.genSalt(10);
    const voicePinHash = await bcrypt.hash(voicePin, salt);

    // Create Profile
    // Generate a local userId (using Mongoose ObjectId string or custom)
    const userId = new mongoose.Types.ObjectId().toString();

    console.log(`[Register] Creating user with userId: ${userId}`);

    const user = await UserProfile.create({
      userId,
      fullName,
      voicePinHash
    });

    console.log(`[Register] User created successfully: ${user.fullName} (${user._id})`);

    const token = generateToken(user.userId);

    res.json({ 
      success: true, 
      token,
      user: { userId: user.userId, fullName: user.fullName }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Register Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login (Voice Login)
router.post('/voice-login', async (req, res) => {
  try {
    // We expect fullName + PIN now since we don't have Clerk session
    const { fullName, voicePin } = loginSchema.parse(req.body);

    const user = await UserProfile.findOne({ fullName });
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND", message: "ما لقيتش حساب بهذا الاسم" });
    }

    const isMatch = await bcrypt.compare(voicePin, user.voicePinHash);
    if (!isMatch) {
      return res.status(401).json({ error: "INVALID_PIN", message: "الـPIN غالط" });
    }

    const token = generateToken(user.userId);

    res.json({ 
      success: true, 
      token,
      user: { userId: user.userId, fullName: user.fullName }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Login Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
