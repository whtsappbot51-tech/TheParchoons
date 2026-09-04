require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const config = require('../config/config');
const Category = require('../models/Category');
const Product = require('../models/Product');

const clearDb = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    const productCount = await Product.deleteMany({});
    console.log(`✅ Deleted ${productCount.deletedCount} products`);

    const catCount = await Category.deleteMany({});
    console.log(`✅ Deleted ${catCount.deletedCount} categories`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing DB:', err);
    process.exit(1);
  }
};

clearDb();
