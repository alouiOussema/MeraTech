require('dotenv').config();
const mongoose = require('mongoose');
const PriceCatalog = require('../src/models/PriceCatalog');
const connectDB = require('../src/config/db');

const items = [
  { name: 'حليب', price: 1.400 },
  { name: 'خبز', price: 0.250 },
  { name: 'سكر', price: 1.500 },
  { name: 'زيت', price: 2.800 },
  { name: 'رز', price: 3.200 },
  { name: 'مكرونة', price: 0.850 },
  { name: 'طماطم', price: 4.500 },
  { name: 'بطاطا', price: 1.800 },
  { name: 'قهوة', price: 8.500 },
  { name: 'ماء', price: 0.900 },
];

const seed = async () => {
  await connectDB();
  
  try {
    await PriceCatalog.deleteMany({});
    await PriceCatalog.insertMany(items);
    console.log('PriceCatalog Seeded!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
