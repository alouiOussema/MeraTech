const express = require('express');
const router = express.Router();
const ShoppingList = require('../models/ShoppingList');
const PriceCatalog = require('../models/PriceCatalog'); // For total calculation if needed
const { requireAuth } = require('../middleware/auth');
const { z } = require('zod');

const itemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().positive().default(1),
});

// Helper
const getList = async (userId) => {
  let list = await ShoppingList.findOne({ clerkUserId: userId });
  if (!list) {
    list = await ShoppingList.create({ clerkUserId: userId });
  }
  return list;
};

// GET /api/courses/list
router.get('/courses/list', requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const list = await getList(userId);
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/courses/items
router.post('/courses/items', requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { name, qty } = itemSchema.parse(req.body);

    const list = await getList(userId);

    // Check if item exists
    const existingItem = list.items.find(item => item.name === name);
    if (existingItem) {
      existingItem.qty += qty;
    } else {
      // Try to find price from catalog
      const catalogItem = await PriceCatalog.findOne({ name });
      const price = catalogItem ? catalogItem.price : 0;
      
      list.items.push({ name, qty, price });
    }

    await list.save();
    res.json(list);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/courses/items/:itemId
router.patch('/courses/items/:itemId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { itemId } = req.params;
    const { qty } = req.body; // simple validation

    if (qty < 1) return res.status(400).json({ error: 'Qty must be > 0' });

    const list = await getList(userId);
    const item = list.items.id(itemId);
    
    if (!item) return res.status(404).json({ error: 'Item not found' });
    
    item.qty = qty;
    await list.save();
    
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/courses/items/:itemId
router.delete('/courses/items/:itemId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { itemId } = req.params;

    const list = await getList(userId);
    list.items.pull(itemId);
    await list.save();
    
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/courses/total
router.get('/courses/total', requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const list = await getList(userId);
    
    let total = 0;
    for (const item of list.items) {
      // Use stored price or fetch fresh? User said "item.price (or catalog price) * qty"
      // We used stored price on add. Let's use that for simplicity, or refresh it.
      // Let's stick to stored price.
      total += (item.price || 0) * item.qty;
    }
    
    res.json({ total, currency: 'TND' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
