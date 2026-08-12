const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Settings = require('../models/Settings');

// GET /api/categories — public active categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .select('name image emoji sortOrder')
      .lean();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load categories.' });
  }
});

// GET /api/products — list products with filters
router.get('/products', async (req, res) => {
  try {
    const { category, featured, bestseller, offer, search, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (bestseller === 'true') filter.isBestSeller = true;
    if (offer === 'true') filter.isOnOffer = true;

    let query;
    if (search) {
      // Use text search index
      filter.$text = { $search: search };
      query = Product.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      query = Product.find(filter).sort({ createdAt: -1 });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await query
      .populate('category', 'name emoji')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to load products.' });
  }
});

// GET /api/products/:id — single product detail
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true })
      .populate('category', 'name emoji')
      .lean();
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load product.' });
  }
});

// GET /api/banners — active homepage banners
router.get('/banners', async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load banners.' });
  }
});

// GET /api/settings/public — public store settings
router.get('/settings/public', async (req, res) => {
  try {
    const allSettings = await Settings.find().lean();
    const settings = {};
    allSettings.forEach(s => {
      settings[s.key] = s.value;
    });
    res.json({
      success: true,
      settings: {
        storeName: settings.STORE_NAME || 'TheParchoons',
        storePhone: settings.STORE_PHONE || '',
        storeAddress: settings.STORE_ADDRESS || '',
        storeTimings: settings.STORE_TIMINGS || '',
        deliveryRadius: parseInt(settings.DELIVERY_RADIUS_METERS) || 500,
        deliveryFee: parseFloat(settings.DELIVERY_FEE) || 0,
        freeDeliveryAbove: parseFloat(settings.FREE_DELIVERY_ABOVE) || 0,
        minOrderAmount: parseFloat(settings.MIN_ORDER_AMOUNT) || 0,
        codEnabled: settings.COD_ENABLED !== 'false',
        announcement: settings.ANNOUNCEMENT || '',
        storeLat: parseFloat(settings.STORE_LATITUDE) || 0,
        storeLon: parseFloat(settings.STORE_LONGITUDE) || 0,
        // Promotional Popup
        popupEnabled: settings.POPUP_ENABLED === 'true',
        popupTitle: settings.POPUP_TITLE || '',
        popupMessage: settings.POPUP_MESSAGE || '',
        popupImage: settings.POPUP_IMAGE || '',
        popupButtonText: settings.POPUP_BUTTON_TEXT || 'Shop Now',
        // Running Marquee
        marqueeEnabled: settings.MARQUEE_ENABLED === 'true',
        marqueeText: settings.MARQUEE_TEXT || '',
        marqueeColor: settings.MARQUEE_COLOR || 'green',
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

module.exports = router;
