const express = require('express');
const router = express.Router();
const PriceCatalog = require('../models/PriceCatalog');

// GET /api/prices?q=name
router.get('/prices', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      // Return all or limited list
      const prices = await PriceCatalog.find().limit(20);
      return res.json(prices);
    }
    
    // Simple contains search
    const prices = await PriceCatalog.find({
      name: { $regex: q, $options: 'i' }
    });
    
    res.json(prices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/prices/:name (Exact match)
router.get('/prices/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const item = await PriceCatalog.findOne({ name });
    
    if (!item) return res.status(404).json({ error: 'Not found' });
    
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
