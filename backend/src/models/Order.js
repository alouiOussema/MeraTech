const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      productId: String, // Or ObjectId if Product model exists
      name: String,
      price: Number,
      quantity: Number,
    }
  ],
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: 'COMPLETED',
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
