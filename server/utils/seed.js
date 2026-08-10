/**
 * Seed script — Populates TheParchoons database with sample data.
 * Run: node utils/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const config = require('../config/config');
const Admin = require('../models/Admin');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Settings = require('../models/Settings');

const seedData = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    // --- Admin ---
    const existingAdmin = await Admin.findOne({ email: config.admin.defaultEmail });
    if (!existingAdmin) {
      await Admin.create({
        email: config.admin.defaultEmail,
        password: config.admin.defaultPassword,
        name: 'TheParchoons Admin',
        role: 'superadmin',
      });
      console.log(`✅ Admin created: ${config.admin.defaultEmail}`);
    } else {
      console.log('ℹ️ Admin already exists, skipping.');
    }

    // --- Categories ---
    const existingCats = await Category.countDocuments();
    if (existingCats === 0) {
      const categories = await Category.insertMany([
        { name: 'Atta & Flours', emoji: '🌾', sortOrder: 1 },
        { name: 'Pulses & Dal', emoji: '🫘', sortOrder: 2 },
        { name: 'Rice & Grains', emoji: '🍚', sortOrder: 3 },
        { name: 'Masala & Spices', emoji: '🌶️', sortOrder: 4 },
        { name: 'Oil & Ghee', emoji: '🛢️', sortOrder: 5 },
        { name: 'Snacks', emoji: '🍿', sortOrder: 6 },
        { name: 'Biscuits', emoji: '🍪', sortOrder: 7 },
        { name: 'Beverages', emoji: '🥤', sortOrder: 8 },
        { name: 'Dairy', emoji: '🥛', sortOrder: 9 },
        { name: 'Personal Care', emoji: '🧴', sortOrder: 10 },
        { name: 'Cleaning', emoji: '🧹', sortOrder: 11 },
        { name: 'Household', emoji: '🏠', sortOrder: 12 },
      ]);
      console.log(`✅ ${categories.length} categories created.`);

      // --- Products ---
      const catMap = {};
      categories.forEach(c => { catMap[c.name] = c._id; });

      const products = await Product.insertMany([
        {
          name: 'Aashirvaad Atta',
          brand: 'Aashirvaad',
          category: catMap['Atta & Flours'],
          description: 'Whole wheat atta for soft rotis',
          variants: [
            { name: '1 kg', price: 55, mrp: 60, inStock: true },
            { name: '5 kg', price: 265, mrp: 290, inStock: true },
            { name: '10 kg', price: 510, mrp: 560, inStock: true },
          ],
          isFeatured: true,
          isBestSeller: true,
        },
        {
          name: 'Pillsbury Maida',
          brand: 'Pillsbury',
          category: catMap['Atta & Flours'],
          description: 'Refined flour for baking and cooking',
          variants: [
            { name: '1 kg', price: 40, mrp: 45, inStock: true },
            { name: '5 kg', price: 185, mrp: 200, inStock: true },
          ],
        },
        {
          name: 'Besan (Gram Flour)',
          brand: 'Local',
          category: catMap['Atta & Flours'],
          description: 'Pure gram flour',
          variants: [
            { name: '500 g', price: 55, mrp: 60, inStock: true },
            { name: '1 kg', price: 105, mrp: 115, inStock: true },
          ],
        },
        {
          name: 'Toor Dal (Arhar)',
          brand: 'Tata Sampann',
          category: catMap['Pulses & Dal'],
          description: 'Premium toor dal',
          variants: [
            { name: '1 kg', price: 155, mrp: 170, inStock: true },
            { name: '2 kg', price: 300, mrp: 330, inStock: true },
          ],
          isBestSeller: true,
        },
        {
          name: 'Moong Dal',
          brand: 'Local',
          category: catMap['Pulses & Dal'],
          description: 'Yellow moong dal',
          variants: [
            { name: '500 g', price: 65, mrp: 70, inStock: true },
            { name: '1 kg', price: 125, mrp: 135, inStock: true },
          ],
        },
        {
          name: 'Masoor Dal',
          brand: 'Local',
          category: catMap['Pulses & Dal'],
          description: 'Red masoor dal',
          variants: [
            { name: '1 kg', price: 95, mrp: 105, inStock: true },
          ],
        },
        {
          name: 'Chana Dal',
          brand: 'Local',
          category: catMap['Pulses & Dal'],
          variants: [
            { name: '1 kg', price: 90, mrp: 100, inStock: true },
          ],
        },
        {
          name: 'Basmati Rice',
          brand: 'India Gate',
          category: catMap['Rice & Grains'],
          description: 'Premium basmati rice',
          variants: [
            { name: '1 kg', price: 120, mrp: 135, inStock: true },
            { name: '5 kg', price: 550, mrp: 600, inStock: true },
          ],
          isFeatured: true,
        },
        {
          name: 'Tata Salt',
          brand: 'Tata',
          category: catMap['Masala & Spices'],
          description: 'Iodized table salt',
          variants: [
            { name: '1 kg', price: 28, mrp: 28, inStock: true },
            { name: '2 kg', price: 52, mrp: 55, inStock: true },
          ],
          isBestSeller: true,
        },
        {
          name: 'MDH Chana Masala',
          brand: 'MDH',
          category: catMap['Masala & Spices'],
          description: 'Authentic chana masala',
          variants: [
            { name: '50 g', price: 40, mrp: 45, inStock: true },
            { name: '100 g', price: 75, mrp: 85, inStock: true },
          ],
        },
        {
          name: 'Haldi Powder',
          brand: 'Everest',
          category: catMap['Masala & Spices'],
          description: 'Pure turmeric powder',
          variants: [
            { name: '100 g', price: 35, mrp: 40, inStock: true },
            { name: '200 g', price: 65, mrp: 75, inStock: true },
          ],
        },
        {
          name: 'Fortune Sunflower Oil',
          brand: 'Fortune',
          category: catMap['Oil & Ghee'],
          description: 'Refined sunflower oil',
          variants: [
            { name: '1 L', price: 140, mrp: 160, inStock: true },
            { name: '5 L', price: 650, mrp: 720, inStock: true },
          ],
          isFeatured: true,
        },
        {
          name: 'Amul Ghee',
          brand: 'Amul',
          category: catMap['Oil & Ghee'],
          description: 'Pure cow ghee',
          variants: [
            { name: '500 ml', price: 310, mrp: 330, inStock: true },
            { name: '1 L', price: 590, mrp: 620, inStock: true },
          ],
          isBestSeller: true,
        },
        {
          name: 'Lays Classic Salted',
          brand: 'Lays',
          category: catMap['Snacks'],
          description: 'Crispy potato chips',
          variants: [
            { name: 'Small (25g)', price: 10, mrp: 10, inStock: true },
            { name: 'Large (73g)', price: 30, mrp: 30, inStock: true },
          ],
        },
        {
          name: 'Kurkure Masala Munch',
          brand: 'Kurkure',
          category: catMap['Snacks'],
          variants: [
            { name: 'Small', price: 10, mrp: 10, inStock: true },
            { name: 'Family Pack', price: 50, mrp: 50, inStock: true },
          ],
        },
        {
          name: 'Parle-G Biscuits',
          brand: 'Parle',
          category: catMap['Biscuits'],
          description: 'Glucose biscuits',
          variants: [
            { name: 'Small Pack', price: 5, mrp: 5, inStock: true },
            { name: 'Family Pack', price: 40, mrp: 45, inStock: true },
          ],
          isBestSeller: true,
        },
        {
          name: 'Amul Taza Milk',
          brand: 'Amul',
          category: catMap['Dairy'],
          description: 'Toned fresh milk',
          variants: [
            { name: '500 ml', price: 30, mrp: 30, inStock: true },
            { name: '1 L', price: 56, mrp: 58, inStock: true },
          ],
        },
        {
          name: 'Surf Excel Detergent',
          brand: 'Surf Excel',
          category: catMap['Cleaning'],
          description: 'Easy wash detergent powder',
          variants: [
            { name: '500 g', price: 55, mrp: 60, inStock: true },
            { name: '1 kg', price: 105, mrp: 115, inStock: true },
          ],
        },
      ]);
      console.log(`✅ ${products.length} products created.`);
    } else {
      console.log(`ℹ️ ${existingCats} categories already exist, skipping products & categories seed.`);
    }

    // --- Settings ---
    const existingSettings = await Settings.countDocuments();
    if (existingSettings === 0) {
      await Settings.insertMany([
        { key: 'STORE_NAME', value: 'TheParchoons', label: 'Store Name', type: 'string' },
        { key: 'STORE_PHONE', value: '', label: 'Store Phone', type: 'string' },
        { key: 'STORE_ADDRESS', value: '', label: 'Store Address', type: 'text' },
        { key: 'STORE_LATITUDE', value: '0', label: 'Store Latitude', type: 'number' },
        { key: 'STORE_LONGITUDE', value: '0', label: 'Store Longitude', type: 'number' },
        { key: 'DELIVERY_RADIUS_METERS', value: '500', label: 'Delivery Radius (meters)', type: 'number' },
        { key: 'DELIVERY_FEE', value: '0', label: 'Delivery Fee (₹)', type: 'number' },
        { key: 'FREE_DELIVERY_ABOVE', value: '0', label: 'Free Delivery Above (₹)', type: 'number' },
        { key: 'MIN_ORDER_AMOUNT', value: '0', label: 'Minimum Order Amount (₹)', type: 'number' },
        { key: 'COD_ENABLED', value: 'true', label: 'Cash on Delivery Enabled', type: 'boolean' },
        { key: 'STORE_TIMINGS', value: '8:00 AM - 10:00 PM', label: 'Store Timings', type: 'string' },
        { key: 'ANNOUNCEMENT', value: '', label: 'Announcement Banner Text', type: 'text' },
      ]);
      console.log('✅ Default settings created.');
    } else {
      console.log('ℹ️ Settings already exist, skipping.');
    }

    console.log('\n🎉 Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedData();
