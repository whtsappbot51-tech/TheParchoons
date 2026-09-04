const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');
const orderService = require('../services/order.service');
const locationService = require('../services/location.service');
const whatsappService = require('../services/whatsapp.service');
const config = require('../config/config');
const { validateOrderCreation, validateAddItems, validateFinalize } = require('../middleware/validate');
const { sanitizeBody } = require('../middleware/sanitize');

// --- Idempotency store (in-memory, keyed by idempotencyKey) ---
const recentOrders = new Map();
const IDEMPOTENCY_WINDOW_MS = 60 * 1000; // 60 seconds

// Cleanup old keys every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, { timestamp }] of recentOrders) {
    if (now - timestamp > IDEMPOTENCY_WINDOW_MS) recentOrders.delete(key);
  }
}, 5 * 60 * 1000);


// POST /api/orders — Place a new order
router.post('/orders', sanitizeBody, validateOrderCreation, async (req, res) => {
  try {
    const { name, phone, address, location, cart, paymentMethod = 'cod', idempotencyKey } = req.body;

    // --- Idempotency check ---
    if (idempotencyKey) {
      const existing = recentOrders.get(idempotencyKey);
      if (existing) {
        return res.status(200).json({ success: true, order: existing.order, duplicate: true });
      }
    }

    // --- Location Validation ---
    let customerLat = null;
    let customerLon = null;
    let distanceFromStore = null;

    if (location && location.latitude && location.longitude) {
      customerLat = parseFloat(location.latitude);
      customerLon = parseFloat(location.longitude);
      if (isNaN(customerLat) || isNaN(customerLon)) {
        customerLat = null;
        customerLon = null;
      } else {
        const locData = await locationService.getDistanceFromStore(customerLat, customerLon);
        distanceFromStore = locData.distance;
      }
    }

    // --- Batch-fetch all products (fixes N+1 query) ---
    const productIds = [...new Set(cart.map(item => item.productId))];
    const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let subtotal = 0;
    const verifiedItems = [];
    let itemsText = '';

    for (const item of cart) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({ success: false, error: `Product ${item.productId} is unavailable.` });
      }

      const variant = product.variants.find(v => v._id.toString() === item.variantId);
      if (!variant) {
        return res.status(400).json({ success: false, error: `Variant for ${product.name} is unavailable.` });
      }

      if (!variant.inStock) {
        return res.status(400).json({ success: false, error: `${product.name} (${variant.name}) is out of stock.` });
      }

      // Server-calculated price — NEVER trust client price
      const lineTotal = variant.price * item.quantity;
      subtotal += lineTotal;

      verifiedItems.push({
        productId: product._id,
        productName: product.name,
        variantId: variant._id.toString(),
        variantName: variant.name,
        price: variant.price,
        quantity: item.quantity,
        lineTotal,
      });

      itemsText += `${product.name} (${variant.name}) x ${item.quantity} - ₹${lineTotal}\n`;
    }

    // --- Delivery Fee & Min Order ---
    let deliveryFee = 0;
    let minOrder = 0;
    let freeDeliveryAbove = 0;

    try {
      const settings = await Settings.find({
        key: { $in: ['DELIVERY_FEE', 'FREE_DELIVERY_ABOVE', 'MIN_ORDER_AMOUNT'] }
      }).lean();
      const sMap = {};
      settings.forEach(s => sMap[s.key] = parseFloat(s.value));

      deliveryFee = sMap.DELIVERY_FEE || config.store.deliveryFee;
      freeDeliveryAbove = sMap.FREE_DELIVERY_ABOVE || config.store.freeDeliveryAbove;
      minOrder = sMap.MIN_ORDER_AMOUNT || config.store.minOrderAmount;
    } catch (e) {
      deliveryFee = config.store.deliveryFee;
      minOrder = config.store.minOrderAmount;
      freeDeliveryAbove = config.store.freeDeliveryAbove;
    }

    if (subtotal < minOrder) {
      return res.status(400).json({ success: false, error: `Minimum order amount is ₹${minOrder}.` });
    }

    if (freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove) {
      deliveryFee = 0;
    }

    const total = subtotal + deliveryFee;

    // --- Create Order ---
    const orderId = await orderService.generateOrderId();

    const newOrder = new Order({
      orderId,
      customer: { name, phone, address, latitude: customerLat, longitude: customerLon, distanceFromStore },
      items: verifiedItems,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      status: 'PENDING',
      statusHistory: [{ status: 'PENDING' }],
    });

    await newOrder.save();

    // --- Increment sales count for each product ---
    try {
      const bulkOps = verifiedItems.map(item => ({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { salesCount: item.quantity } }
        }
      }));
      if (bulkOps.length > 0) {
        await Product.bulkWrite(bulkOps);
      }
    } catch (err) {
      console.error('Failed to update product sales count:', err.message);
    }

    // --- Store idempotency key ---
    const orderResponse = { orderId, total, status: newOrder.status };
    if (idempotencyKey) {
      recentOrders.set(idempotencyKey, { order: orderResponse, timestamp: Date.now() });
    }

    // --- Save/Update Customer Profile ---
    try {
      let customer = await Customer.findOne({ phone });
      if (!customer) {
        customer = new Customer({ name, phone, addresses: [] });
      }
      customer.orderCount += 1;
      customer.lastOrderAt = new Date();
      const addressExists = customer.addresses.some(a => a.address === address);
      if (!addressExists) {
        customer.addresses.push({
          address, latitude: customerLat, longitude: customerLon,
          isDefault: customer.addresses.length === 0,
        });
      }
      await customer.save();
    } catch (custErr) {
      console.error('Failed to update customer profile:', custErr.message);
      // Non-critical — order is already saved
    }

    // --- WhatsApp (fire-and-forget, order is already saved) ---
    (async () => {
      try {
        const ownerPhone = config.whatsapp.ownerPhone;
        let customerMsg = `✅ *Order Confirmed!*\n\n`;
        customerMsg += `Hey ${name}! 👋\n`;
        customerMsg += `Thank you for shopping with *TheParchoons* 💚\n\n`;
        customerMsg += `🆔 *Order ID:* ${orderId}\n\n`;
        customerMsg += `🛍️ *Your Items:*\n${itemsText}\n`;
        customerMsg += `💰 *Subtotal:* ₹${subtotal}\n`;
        customerMsg += `🚚 *Delivery:* ₹${deliveryFee}\n`;
        customerMsg += `✅ *Total:* ₹${total} (Cash on Delivery)\n\n`;
        customerMsg += `⚡ *10 Min Delivery Guarantee!* ⚡\n`;
        customerMsg += `📦 Your order is being prepared and our delivery partner will reach you soon! 🚀\n\n`;
        if (ownerPhone) {
          customerMsg += `📞 *For any queries contact:* +${ownerPhone}`;
        }
        await whatsappService.sendText(phone, customerMsg);
      } catch (err) {
        console.error('Failed to send WhatsApp notifications:', err.message);
      }
    })();

    res.status(201).json({ success: true, order: orderResponse });

  } catch (err) {
    console.error('Order placement error:', err);
    res.status(500).json({ success: false, error: 'Failed to place order.' });
  }
});

// PATCH /api/orders/:orderId/add-items — Add forgotten items
router.patch('/orders/:orderId/add-items', sanitizeBody, validateAddItems, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cart } = req.body;

    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
    const order = await Order.findOne({ orderId, status: 'PENDING', createdAt: { $gte: twoMinAgo } });

    if (!order) {
      return res.status(400).json({ success: false, error: 'Order not found or modification window has expired.' });
    }

    // Batch fetch products
    const productIds = [...new Set(cart.map(item => item.productId))];
    const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let addedSubtotal = 0;
    const newItems = [];

    for (const item of cart) {
      const product = productMap.get(item.productId);
      if (!product) continue;

      const variant = product.variants.find(v => v._id.toString() === item.variantId);
      if (!variant) continue;

      const lineTotal = variant.price * item.quantity;
      addedSubtotal += lineTotal;

      const existingItem = order.items.find(
        i => i.productId.toString() === item.productId && i.variantId === item.variantId
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
        existingItem.lineTotal += lineTotal;
      } else {
        newItems.push({
          productId: product._id,
          productName: product.name,
          variantId: variant._id.toString(),
          variantName: variant.name,
          price: variant.price,
          quantity: item.quantity,
          lineTotal,
        });
      }
    }

    if (newItems.length > 0) {
      order.items.push(...newItems);
    }

    order.subtotal += addedSubtotal;
    order.total = order.subtotal + order.deliveryFee;

    await order.save();

    // WhatsApp update (fire-and-forget)
    (async () => {
      try {
        let updatedItemsText = '';
        for (const item of order.items) {
          updatedItemsText += `${item.productName} (${item.variantName}) x ${item.quantity} - ₹${item.lineTotal}\n`;
        }
        let updateMsg = `📝 *Order Updated!*\n\n`;
        updateMsg += `Your order *${orderId}* has been updated with new items.\n\n`;
        updateMsg += `🛍️ *Updated Items:*\n${updatedItemsText}\n`;
        updateMsg += `💰 *Subtotal:* ₹${order.subtotal}\n`;
        updateMsg += `🚚 *Delivery:* ₹${order.deliveryFee}\n`;
        updateMsg += `✅ *New Total:* ₹${order.total} (Cash on Delivery)\n\n`;
        updateMsg += `⚡ *10 Min Delivery!* ⚡\n`;
        updateMsg += `📦 We'll pack everything together! 💚`;
        await whatsappService.sendText(order.customer.phone, updateMsg);
      } catch (err) {
        console.error('Failed to send update notification:', err.message);
      }
    })();

    res.json({ success: true, order: { orderId, total: order.total, itemCount: order.items.length } });

  } catch (err) {
    console.error('Add items error:', err);
    res.status(500).json({ success: false, error: 'Failed to add items.' });
  }
});

// POST /api/orders/:orderId/finalize — Send owner notification (with phone verification)
router.post('/orders/:orderId/finalize', sanitizeBody, validateFinalize, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { phone } = req.body;
    const ownerPhone = config.whatsapp.ownerPhone;

    if (!ownerPhone) {
      return res.json({ success: true, message: 'No owner phone configured.' });
    }

    // Verify the request is from the actual customer
    const order = await Order.findOne({ orderId, 'customer.phone': phone }).lean();
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found or phone mismatch.' });
    }

    const mapsLink = (order.customer.latitude && order.customer.longitude)
      ? `https://maps.google.com/?q=${order.customer.latitude},${order.customer.longitude}`
      : 'Not provided';

    let itemsText = '';
    for (const item of order.items) {
      itemsText += `${item.productName} (${item.variantName}) x ${item.quantity} - ₹${item.lineTotal}\n`;
    }

    let ownerMsg = `📦 *NEW ORDER RECEIVED!* 🔔\n`;
    ownerMsg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    ownerMsg += `🆔 *Order ID:* ${order.orderId}\n`;
    ownerMsg += `👤 *Customer:* ${order.customer.name}\n`;
    ownerMsg += `📞 *Phone:* ${order.customer.phone}\n`;
    ownerMsg += `📍 *Address:* ${order.customer.address}\n`;
    ownerMsg += `🗺️ *Location:* ${mapsLink}\n`;
    if (order.customer.distanceFromStore !== null) {
      ownerMsg += `📏 *Distance:* ${order.customer.distanceFromStore} meters\n`;
    }
    ownerMsg += `\n🛍️ *Items Ordered:*\n${itemsText}\n`;
    ownerMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
    ownerMsg += `💰 *Subtotal:* ₹${order.subtotal}\n`;
    ownerMsg += `🚚 *Delivery Fee:* ₹${order.deliveryFee}\n`;
    ownerMsg += `✅ *Total:* ₹${order.total} (COD)\n`;
    ownerMsg += `━━━━━━━━━━━━━━━━━━━━`;

    await whatsappService.sendText(ownerPhone, ownerMsg);

    res.json({ success: true, message: 'Owner notified.' });

  } catch (err) {
    console.error('Finalize error:', err);
    res.status(500).json({ success: false, error: 'Failed to notify owner.' });
  }
});

// GET /api/orders/:orderId — Track order
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { phone } = req.query;
    const { orderId } = req.params;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number required for tracking.' });
    }

    const order = await Order.findOne({ orderId, 'customer.phone': phone })
      .select('-statusHistory.changedBy -__v')
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found or phone number mismatch.' });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch order details.' });
  }
});

module.exports = router;
