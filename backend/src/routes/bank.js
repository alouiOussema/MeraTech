const express = require('express');
const router = express.Router();
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const { requireAuth } = require('../middleware/auth');
const { z } = require('zod');

// Validation
const transferSchema = z.object({
  toName: z.string().min(1),
  amount: z.number().positive(),
});

// Helper to get or create account
const getAccount = async (userId) => {
  let account = await BankAccount.findOne({ userId });
  if (!account) {
    // Should be created at register, but fallback just in case
    account = await BankAccount.create({ userId, balance: 200 });
  }
  return account;
};

// GET /api/bank/balance
router.get('/bank/balance', requireAuth, async (req, res) => {
  try {
    const { userId } = req;
    const account = await getAccount(userId);
    res.json({ balance: account.balance, currency: account.currency });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

const User = require('../models/User');

// POST /api/bank/transfer
router.post('/bank/transfer', requireAuth, async (req, res) => {
  try {
    const { userId } = req;
    const { toName, amount } = transferSchema.parse(req.body);

    // Sender Account
    const senderAccount = await getAccount(userId);

    if (senderAccount.balance < amount) {
      return res.status(400).json({ error: 'Rassid ghayr kafi (Insufficient funds)' });
    }

    // Find Recipient
    const recipientUser = await User.findOne({ name: toName });
    if (!recipientUser) {
      return res.status(404).json({ error: 'Recipient not found', message: 'ما لقيتش مستخدم بهذا الاسم' });
    }
    
    // Recipient Account
    const recipientAccount = await getAccount(recipientUser._id);

    // Perform Transfer (Atomic-like)
    senderAccount.balance -= amount;
    await senderAccount.save();

    recipientAccount.balance += amount;
    await recipientAccount.save();

    // Record Transaction for Sender (OUT)
    const senderTx = await Transaction.create({
      userId,
      type: 'TRANSFER_OUT',
      amount: -amount,
      meta: { toName, recipientId: recipientUser._id }
    });

    // Record Transaction for Recipient (IN)
    await Transaction.create({
      userId: recipientUser._id,
      type: 'TRANSFER_IN',
      amount: amount,
      meta: { fromName: (await User.findById(userId)).name, senderId: userId }
    });

    res.json({ 
      success: true, 
      balance: senderAccount.balance, 
      transaction: senderTx
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bank/transactions
router.get('/bank/transactions', requireAuth, async (req, res) => {
  try {
    const { userId } = req;
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
