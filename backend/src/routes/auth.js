const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const UserProfile = require('../models/UserProfile');
const { requireAuth } = require('@clerk/clerk-sdk-node');

// Validation schemas
const registerSchema = z.object({
  fullName: z.string().min(1, "الاسم لازم يكون موجود"),
  voicePin: z.string().length(6, "الـPIN لازم يكون 6 أرقام").regex(/^\d+$/, "الـPIN لازم يكون أرقام كهو")
});

const loginSchema = z.object({
  voicePin: z.string().length(6, "الـPIN لازم يكون 6 أرقام")
});

// Register new profile (Public for demo)
router.post('/register', async (req, res) => {
  try {
    // For demo, we might not have a Clerk ID if strictly voice-only without Clerk UI
    // We'll generate one or use provided
    let userId = req.body.clerkUserId;
    if (!userId && req.auth) userId = req.auth.userId;
    if (!userId) userId = `demo_${Date.now()}`; 

    const { fullName, voicePin } = registerSchema.parse(req.body);

    // Check if profile exists
    const existingUser = await UserProfile.findOne({ clerkUserId: userId });
    if (existingUser) {
      return res.status(409).json({ error: "USER_EXISTS", message: "هذا اليوزر موجود قبل" });
    }

    // Hash PIN
    const salt = await bcrypt.genSalt(10);
    const voicePinHash = await bcrypt.hash(voicePin, salt);

    // Create Profile
    const user = await UserProfile.create({
      clerkUserId: userId,
      fullName,
      voicePinHash
    });

    res.status(201).json({ ok: true, user });
  } catch (error) {
    console.error("Register Error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: error.errors[0].message });
    }
    res.status(500).json({ error: "SERVER_ERROR", message: "صار مشكل في السرفر" });
  }
});

// Voice PIN Verification (Public for demo)
router.post('/voice-login', async (req, res) => {
  try {
    // For demo, we need to find user by something. Name? 
    // Or just check if ANY user has this PIN? (Insecure but OK for demo)
    // Or we expect clerkUserId in body
    let userId = req.body.clerkUserId;
    if (!userId && req.auth) userId = req.auth.userId;
    
    // If no userId, we can't really login securely. 
    // Let's assume we pass the name in body for the demo lookup?
    // Or just skip this check if we can't identify.
    // Let's fallback to finding by name if provided, else error.
    
    const { voicePin } = loginSchema.parse(req.body);
    let user;

    if (userId) {
       user = await UserProfile.findOne({ clerkUserId: userId });
    } else if (req.body.name) {
       user = await UserProfile.findOne({ fullName: req.body.name });
    }

    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND", message: "اليوزر هذا موش موجود" });
    }

    const isMatch = await bcrypt.compare(voicePin, user.voicePinHash);
    if (!isMatch) {
      return res.status(401).json({ error: "INVALID_PIN", message: "الـPIN غالط" });
    }

    res.json({ ok: true, message: "مرحبا بيك" });
  } catch (error) {
    console.error("Voice Login Error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: error.errors[0].message });
    }
    res.status(500).json({ error: "SERVER_ERROR", message: "صار مشكل في السرفر" });
  }
});

module.exports = router;
