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
    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
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
      { userId },
      { fullName },
      { new: true }
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