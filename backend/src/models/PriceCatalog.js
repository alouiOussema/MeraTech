const mongoose = require('mongoose');

const PriceCatalogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'TND',
  },
}, { timestamps: true });

module.exports = mongoose.model('PriceCatalog', PriceCatalogSchema);
