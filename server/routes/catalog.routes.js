const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Settings = require('../models/Settings');
const cacheService = require('../services/cache.service');

// GET /api/categories — public active categories (CACHED)
router.get('/categories', async (req, res) => {
  try {
    const cacheKey = 'categories';
    let categories = cacheService.get(cacheKey);

    if (!categories) {
      categories = await Category.find({ isActive: true })
        .sort({ sortOrder: 1 })
        .select('name image emoji sortOrder')
        .lean();
      cacheService.set(cacheKey, categories, 300); // 5 min
    }

    res.set('Cache-Control', 'public, max-age=60');
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load categories.' });
  }
});

// GET /api/products — list products with filters (CACHED for featured/bestseller)
router.get('/products', async (req, res) => {
  try {
    const { category, featured, bestseller, offer, search, page = 1, limit = 50 } = req.query;

    // Build a cache key for common non-search queries
    const cacheKey = search ? null : `products:${category || 'all'}:f${featured}:b${bestseller}:o${offer}:p${page}:l${limit}`;

    if (cacheKey) {
      const cached = cacheService.get(cacheKey);
      if (cached) {
        res.set('Cache-Control', 'public, max-age=30');
        return res.json(cached);
      }
    }

    const filter = { isActive: true };
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (bestseller === 'true') filter.isBestSeller = true;
    if (offer === 'true') filter.isOnOffer = true;

    let query;
    if (search) {
      filter.$text = { $search: search };
      query = Product.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      query = Product.find(filter).sort({ createdAt: -1 });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await query
      .populate('category', 'name emoji')
      .select('name brand image variants isFeatured isBestSeller isOnOffer offerText category')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(filter);

    const response = {
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };

    if (cacheKey) {
      cacheService.set(cacheKey, response, 120); // 2 min
    }

    res.set('Cache-Control', search ? 'no-cache' : 'public, max-age=30');
    res.json(response);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, error: 'Failed to load products.' });
  }
});

// GET /api/products/:id — single product detail
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true })
      .populate('category', 'name emoji')
      .lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found.' });
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load product.' });
  }
});

// GET /api/banners — active homepage banners (CACHED)
router.get('/banners', async (req, res) => {
  try {
    const cacheKey = 'banners';
    let banners = cacheService.get(cacheKey);

    if (!banners) {
      banners = await Banner.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
      cacheService.set(cacheKey, banners, 300);
    }

    res.set('Cache-Control', 'public, max-age=60');
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load banners.' });
  }
});

// GET /api/settings/public — public store settings (CACHED)
router.get('/settings/public', async (req, res) => {
  try {
    const cacheKey = 'settings:public';
    let settingsObj = cacheService.get(cacheKey);

    if (!settingsObj) {
      const allSettings = await Settings.find().lean();
      const s = {};
      allSettings.forEach(item => { s[item.key] = item.value; });

      settingsObj = {
        storeName: s.STORE_NAME || 'TheParchoons',
        storePhone: s.STORE_PHONE || '',
        storeAddress: s.STORE_ADDRESS || '',
        storeTimings: s.STORE_TIMINGS || '',
        deliveryRadius: parseInt(s.DELIVERY_RADIUS_METERS) || 500,
        deliveryFee: parseFloat(s.DELIVERY_FEE) || 0,
        freeDeliveryAbove: parseFloat(s.FREE_DELIVERY_ABOVE) || 0,
        minOrderAmount: parseFloat(s.MIN_ORDER_AMOUNT) || 0,
        codEnabled: s.COD_ENABLED !== 'false',
        announcement: s.ANNOUNCEMENT || '',
        storeLat: parseFloat(s.STORE_LATITUDE) || 0,
        storeLon: parseFloat(s.STORE_LONGITUDE) || 0,
        popupEnabled: s.POPUP_ENABLED === 'true',
        popupTitle: s.POPUP_TITLE || '',
        popupMessage: s.POPUP_MESSAGE || '',
        popupImage: s.POPUP_IMAGE || '',
        popupButtonText: s.POPUP_BUTTON_TEXT || 'Shop Now',
        marqueeEnabled: s.MARQUEE_ENABLED === 'true',
        marqueeText: s.MARQUEE_TEXT || '',
        marqueeColor: s.MARQUEE_COLOR || 'green',
      };

      cacheService.set(cacheKey, settingsObj, 600); // 10 min
    }

    res.set('Cache-Control', 'public, max-age=120');
    res.json({ success: true, settings: settingsObj });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load settings.' });
  }
});

module.exports = router;
