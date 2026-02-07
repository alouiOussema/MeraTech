const mongoose = require('mongoose');

const ShoppingItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, default: 1 },
  price: { type: Number, default: 0 }, // Optional: snapshot of price
  createdAt: { type: Date, default: Date.now }
});

const ShoppingListSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: "قائمة الشراء",
  },
  items: [ShoppingItemSchema],
}, { timestamps: true });

module.exports = mongoose.model('ShoppingList', ShoppingListSchema);