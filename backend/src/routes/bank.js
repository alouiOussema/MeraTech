const express = require('express');
const router = express.Router();
const BankAccount = require('../models/BankAccount');
const Transfer = require('../models/Transfer');
const { requireAuth } = require('../middleware/auth');
const { z } = require('zod');

// Validation
const transferSchema = z.object({
  toName: z.string().min(1),
  amount: z.number().positive(),
});

// Helper to get or create account
const getAccount = async (userId) => {
  let account = await BankAccount.findOne({ clerkUserId: userId });
  if (!account) {
    account = await BankAccount.create({ clerkUserId: userId });
  }
  return account;
};

// GET /api/bank/balance
router.get('/bank/balance', requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const account = await getAccount(userId);
    res.json({ balance: account.balance, currency: account.currency });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/bank/transfer
router.post('/bank/transfer', requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { toName, amount } = transferSchema.parse(req.body);

    const account = await getAccount(userId);

    if (account.balance < amount) {
      return res.status(400).json({ error: 'Rassid ghayr kafi (Insufficient funds)' });
    }

    // Deduct
    account.balance -= amount;
    await account.save();

    // Record Transfer
    const transfer = await Transfer.create({
      clerkUserId: userId,
      toName,
      amount,
    });

    res.json({ 
      success: true, 
      balance: account.balance, 
      transfer 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bank/transfers
router.get('/bank/transfers', requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const transfers = await Transfer.find({ clerkUserId: userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(transfers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
