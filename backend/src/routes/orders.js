const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');
const { z } = require('zod');

// Validation
const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive()
  })).min(1)
});

// POST /api/orders/checkout
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const { userId } = req;
    const { items } = checkoutSchema.parse(req.body);

    // 1. Calculate Total
    let total = 0;
    const orderItems = [];

    // Fetch all products involved
    // Optimization: find all IDs first
    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    
    // Map for easy lookup
    const productMap = {};
    products.forEach(p => productMap[p._id.toString()] = p);

    for (const item of items) {
      const product = productMap[item.productId];
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }
      
      const itemTotal = product.price * item.quantity;
      total += itemTotal;
      
      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });
    }

    // 2. Check Bank Balance
    const account = await BankAccount.findOne({ userId });
    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    if (account.balance < total) {
      return res.status(400).json({ 
        error: 'INSUFFICIENT_FUNDS',
        message: 'الرصيد غير كافي',
        required: total,
        balance: account.balance
      });
    }

    // 3. Process Transaction
    // Use transaction for atomicity if possible, but for now sequential is fine
    
    // Deduct Balance
    account.balance -= total;
    await account.save();

    // Create Order
    const order = await Order.create({
      userId,
      items: orderItems,
      total,
      status: 'COMPLETED'
    });

    // Create Bank Transaction
    await Transaction.create({
      userId,
      type: 'CHECKOUT',
      amount: -total,
      meta: { 
        orderId: order._id, 
        itemCount: items.length 
      }
    });

    res.json({
      success: true,
      orderId: order._id,
      newBalance: account.balance,
      message: 'تمت عملية الشراء بنجاح'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Checkout Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
