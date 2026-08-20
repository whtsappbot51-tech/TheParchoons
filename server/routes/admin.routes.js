const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { sanitizeBody } = require('../middleware/sanitize');
const { validateCategory, validateProduct, validateBanner, validateSettings, validateMongoId } = require('../middleware/validate');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');
const cacheService = require('../services/cache.service');

// Protect all admin routes
router.use(authMiddleware);

// Helper: log admin action
const logAction = async (action, resource, resourceId, adminEmail, details = '') => {
  try {
    await AuditLog.create({ action, resource, resourceId: String(resourceId), adminEmail, details });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

// --- DASHBOARD STATS ---
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, ordersToday, totalProducts, totalCustomers] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Product.countDocuments(),
      Customer.countDocuments()
    ]);

    const revenueData = await Order.aggregate([
      { $match: { status: 'DELIVERED' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const revenue = revenueData.length > 0 ? revenueData[0].total : 0;

    res.json({
      success: true,
      stats: { totalOrders, ordersToday, totalProducts, totalCustomers, revenue }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats.' });
  }
});

// --- CATEGORIES ---
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 }).lean();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories.' });
  }
});

router.post('/categories', sanitizeBody, validateCategory, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    cacheService.invalidateCategories();
    logAction('CREATE', 'category', category._id, req.admin.email, `Created: ${category.name}`);
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create category.' });
  }
});

router.put('/categories/:id', validateMongoId, sanitizeBody, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, error: 'Category not found.' });
    cacheService.invalidateCategories();
    logAction('UPDATE', 'category', req.params.id, req.admin.email, `Updated: ${category.name}`);
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update category.' });
  }
});

router.delete('/categories/:id', validateMongoId, async (req, res) => {
  try {
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete category with associated products.' });
    }
    await Category.findByIdAndDelete(req.params.id);
    cacheService.invalidateCategories();
    logAction('DELETE', 'category', req.params.id, req.admin.email);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete category.' });
  }
});

// --- PRODUCTS ---
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find().populate('category', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(),
    ]);
    res.json({ success: true, products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch products.' });
  }
});

router.post('/products', sanitizeBody, validateProduct, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    cacheService.invalidateProducts();
    logAction('CREATE', 'product', product._id, req.admin.email, `Created: ${product.name}`);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create product.' });
  }
});

router.put('/products/:id', validateMongoId, sanitizeBody, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('category', 'name');
    if (!product) return res.status(404).json({ success: false, error: 'Product not found.' });
    cacheService.invalidateProducts();
    logAction('UPDATE', 'product', req.params.id, req.admin.email, `Updated: ${product.name}`);
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update product.' });
  }
});

router.delete('/products/:id', validateMongoId, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    cacheService.invalidateProducts();
    logAction('DELETE', 'product', req.params.id, req.admin.email);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete product.' });
  }
});

// --- BANNERS ---
router.get('/banners', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1 }).lean();
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch banners.' });
  }
});

router.post('/banners', sanitizeBody, validateBanner, async (req, res) => {
  try {
    const banner = new Banner(req.body);
    await banner.save();
    cacheService.invalidateBanners();
    logAction('CREATE', 'banner', banner._id, req.admin.email);
    res.status(201).json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create banner.' });
  }
});

router.put('/banners/:id', validateMongoId, sanitizeBody, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) return res.status(404).json({ success: false, error: 'Banner not found.' });
    cacheService.invalidateBanners();
    logAction('UPDATE', 'banner', req.params.id, req.admin.email);
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update banner.' });
  }
});

router.delete('/banners/:id', validateMongoId, async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    cacheService.invalidateBanners();
    logAction('DELETE', 'banner', req.params.id, req.admin.email);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete banner.' });
  }
});

// --- ORDERS ---
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch orders.' });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch order.' });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    order.status = status;
    if (notes) order.notes = notes;
    order.statusHistory.push({ status, changedBy: req.admin.email });

    if (status === 'DELIVERED' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }

    await order.save();
    logAction('UPDATE', 'order', order.orderId, req.admin.email, `Status → ${status}`);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update order status.' });
  }
});

// --- CUSTOMERS ---
router.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ lastOrderAt: -1 }).lean();
    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch customers.' });
  }
});

// --- SETTINGS ---
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.find().lean();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings.' });
  }
});

router.put('/settings', sanitizeBody, validateSettings, async (req, res) => {
  try {
    const updates = req.body.settings;
    for (const update of updates) {
      await Settings.findOneAndUpdate(
        { key: update.key },
        { value: update.value },
        { upsert: true }
      );
    }
    cacheService.invalidateSettings();
    logAction('SETTINGS_UPDATE', 'settings', '', req.admin.email);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update settings.' });
  }
});

// --- AUDIT LOG (read-only) ---
router.get('/audit-log', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit log.' });
  }
});

module.exports = router;
