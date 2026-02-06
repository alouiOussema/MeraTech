const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const { requireAuth } = require('../middleware/auth');
const { z } = require('zod');

// Schema for validation
const updateProfileSchema = z.object({
  fullName: z.string().min(1),
});

// GET /api/profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    let profile = await UserProfile.findOne({ clerkUserId: userId });

    if (!profile) {
      // Create automatically if missing
      // We might want to fetch name from Clerk if possible, but here we just create a placeholder or use what's provided
      // Since we don't have access to Clerk User API here without Secret Key calls, we'll just init with "User"
      profile = await UserProfile.create({
        clerkUserId: userId,
        fullName: 'مستخدم جديد', // "New User" in Arabic/Generic
      });
    }

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/profile
router.post('/profile', requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { fullName } = updateProfileSchema.parse(req.body);

    const profile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      { fullName },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
