const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BankAccount = require('../models/BankAccount');
const { JWT_SECRET } = require('../middleware/auth');

// Validation schemas
const registerSchema = z.object({
  fullName: z.string().min(1, "الاسم لازم يكون موجود"),
  voicePin: z.string().length(6, "الـPIN لازم يكون 6 أرقام").regex(/^\d+$/, "الـPIN لازم يكون أرقام كهو")
});

const loginSchema = z.object({
  fullName: z.string().min(1, "الاسم لازم يكون موجود"),
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

    // Check if user exists
    const existingUser = await User.findOne({ name: fullName });
    if (existingUser) {
      console.log(`[Register] User already exists: ${fullName}`);
      return res.status(409).json({ error: "USER_EXISTS", message: "هذا اليوزر موجود قبل" });
    }

    // Hash PIN
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(voicePin, salt);

    // Create User (without bankAccountId first)
    // We use a transaction or just sequential saves. Sequential is fine for now.
    
    // 1. Create User
    const user = new User({
      name: fullName,
      pinHash
    });
    
    // Save user to get _id
    await user.save();
    console.log(`[Register] User saved with ID: ${user._id}`);

    // 2. Create BankAccount
    const bankAccount = await BankAccount.create({
      userId: user._id,
      balance: 200, // Default 200 TND
      currency: 'TND'
    });
    console.log(`[Register] BankAccount created with ID: ${bankAccount._id}`);

    // 3. Update User with bankAccountId
    user.bankAccountId = bankAccount._id;
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({ 
      success: true, 
      token,
      user: { userId: user._id, name: user.name }
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
    const { fullName, voicePin } = loginSchema.parse(req.body);

    const user = await User.findOne({ name: fullName });
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND", message: "ما لقيتش حساب بهذا الاسم" });
    }

    const isMatch = await bcrypt.compare(voicePin, user.pinHash);
    if (!isMatch) {
      return res.status(401).json({ error: "INVALID_PIN", message: "الـPIN غالط" });
    }

    const token = generateToken(user._id);

    res.json({ 
      success: true, 
      token,
      user: { userId: user._id, name: user.name }
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
