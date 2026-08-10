const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');

// Protect all admin routes
router.use(authMiddleware);

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

    // Optional: Calculate total revenue (completed orders)
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
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
});

// --- CATEGORIES ---
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ sortOrder: 1 }).lean();
        res.json({ success: true, categories });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});

router.post('/categories', async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).json({ success: true, category });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create category.' });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, category });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update category.' });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        // Check if products use this category
        const productsCount = await Product.countDocuments({ category: req.params.id });
        if (productsCount > 0) {
            return res.status(400).json({ error: 'Cannot delete category with associated products.' });
        }
        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete category.' });
    }
});

// --- PRODUCTS ---
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find().populate('category', 'name').sort({ createdAt: -1 }).lean();
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products.' });
    }
});

router.post('/products', async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json({ success: true, product });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create product.' });
    }
});

router.put('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('category', 'name');
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update product.' });
    }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product.' });
    }
});

// --- BANNERS ---
router.get('/banners', async (req, res) => {
    try {
        const banners = await Banner.find().sort({ sortOrder: 1 }).lean();
        res.json({ success: true, banners });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch banners.' });
    }
});

router.post('/banners', async (req, res) => {
    try {
        const banner = new Banner(req.body);
        await banner.save();
        res.status(201).json({ success: true, banner });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create banner.' });
    }
});

router.put('/banners/:id', async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, banner });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update banner.' });
    }
});

router.delete('/banners/:id', async (req, res) => {
    try {
        await Banner.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete banner.' });
    }
});

// --- ORDERS ---
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).lean();
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders.' });
    }
});

router.get('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).lean();
        if(!order) return res.status(404).json({error: 'Order not found'});
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order.' });
    }
});

router.put('/orders/:id/status', async (req, res) => {
    try {
        const { status, notes } = req.body;
        const validStatuses = ['PENDING', 'CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status.' });
        }

        const order = await Order.findById(req.params.id);
        if(!order) return res.status(404).json({error: 'Order not found'});

        order.status = status;
        if (notes) order.notes = notes;
        
        order.statusHistory.push({
            status,
            changedBy: req.admin.email
        });

        // If delivered, update payment status for COD
        if (status === 'DELIVERED' && order.paymentMethod === 'cod') {
            order.paymentStatus = 'paid';
        }

        await order.save();
        res.json({ success: true, order });

        // Optional: Send WhatsApp update to customer about status change
        // Note: For MVP, maybe only send when OUT_FOR_DELIVERY or CANCELLED

    } catch (err) {
        res.status(500).json({ error: 'Failed to update order status.' });
    }
});

// --- CUSTOMERS ---
router.get('/customers', async (req, res) => {
    try {
        const customers = await Customer.find().sort({ lastOrderAt: -1 }).lean();
        res.json({ success: true, customers });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch customers.' });
    }
});

// --- SETTINGS ---
router.get('/settings', async (req, res) => {
    try {
        const settings = await Settings.find().lean();
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings.' });
    }
});

router.put('/settings', async (req, res) => {
    try {
        // Expecting an array of setting objects [{key, value}, ...]
        const updates = req.body.settings;
        if (!Array.isArray(updates)) return res.status(400).json({ error: 'Invalid format.' });

        for (const update of updates) {
            await Settings.findOneAndUpdate(
                { key: update.key },
                { value: update.value },
                { upsert: true }
            );
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update settings.' });
    }
});


module.exports = router;
