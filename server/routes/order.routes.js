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

// POST /api/orders — Place a new order
router.post('/orders', async (req, res) => {
  try {
    const { name, phone, address, location, cart, paymentMethod = 'cod' } = req.body;

    // 1. Basic Validation
    if (!name || !phone || !address || !cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Missing required order fields.' });
    }

    if (paymentMethod !== 'cod') {
      return res.status(400).json({ error: 'Only Cash on Delivery is supported currently.' });
    }

    // 2. Location Validation (if location provided)
    let customerLat = null;
    let customerLon = null;
    let distanceFromStore = null;

    if (location && location.latitude && location.longitude) {
      customerLat = parseFloat(location.latitude);
      customerLon = parseFloat(location.longitude);
      
      const locData = await locationService.getDistanceFromStore(customerLat, customerLon);
      distanceFromStore = locData.distance;

      if (locData.distance !== null && !locData.withinRadius) {
        // We log it, but we might not block it depending on strictness.
        // For now, let's allow it but we could block it here if required.
        // return res.status(400).json({ error: `Sorry, we only deliver within ${locData.radiusMeters} meters.` });
      }
    }

    // 3. Price Verification
    let subtotal = 0;
    const verifiedItems = [];
    let itemsText = ''; // For WhatsApp

    for (const item of cart) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ error: `Product ${item.productName || item.productId} is unavailable.` });
      }

      const variant = product.variants.id(item.variantId);
      if (!variant) {
        return res.status(400).json({ error: `Variant for ${product.name} is unavailable.` });
      }

      const lineTotal = variant.price * item.quantity;
      subtotal += lineTotal;

      verifiedItems.push({
        productId: product._id,
        productName: product.name,
        variantId: variant._id.toString(),
        variantName: variant.name,
        price: variant.price,
        quantity: item.quantity,
        lineTotal
      });

      itemsText += `${product.name} (${variant.name}) x ${item.quantity} - ₹${lineTotal}\n`;
    }

    // 4. Delivery Fee & Min Order Calculation
    let deliveryFee = 0;
    let minOrder = 0;
    let freeDeliveryAbove = 0;
    
    try {
      const settings = await Settings.find({ key: { $in: ['DELIVERY_FEE', 'FREE_DELIVERY_ABOVE', 'MIN_ORDER_AMOUNT'] } });
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
        return res.status(400).json({ error: `Minimum order amount is ₹${minOrder}.` });
    }

    if (freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove) {
        deliveryFee = 0;
    }

    const total = subtotal + deliveryFee;

    // 5. Create Order
    const orderId = await orderService.generateOrderId();

    const newOrder = new Order({
      orderId,
      customer: {
        name,
        phone,
        address,
        latitude: customerLat,
        longitude: customerLon,
        distanceFromStore,
      },
      items: verifiedItems,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      status: 'PENDING',
      statusHistory: [{ status: 'PENDING' }]
    });

    await newOrder.save();

    // 6. Save/Update Customer Profile
    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = new Customer({ name, phone, addresses: [] });
    }
    customer.orderCount += 1;
    customer.lastOrderAt = new Date();
    
    // Check if address exists, if not add it
    const addressExists = customer.addresses.some(a => a.address === address);
    if (!addressExists) {
        // Set as default if it's the first one
        customer.addresses.push({
            address,
            latitude: customerLat,
            longitude: customerLon,
            isDefault: customer.addresses.length === 0
        });
    }
    await customer.save();

    // 7. Send WhatsApp Notifications
    (async () => {
        try {
            const ownerPhone = config.whatsapp.ownerPhone;

            // Send CUSTOMER confirmation immediately
            let customerMsg = `✅ *Order Confirmed!*\n\n`;
            customerMsg += `Hey ${name}! 👋\n`;
            customerMsg += `Thank you for shopping with *TheParchoons* 💚\n\n`;
            customerMsg += `🆔 *Order ID:* ${orderId}\n\n`;
            customerMsg += `🛍️ *Your Items:*\n${itemsText}\n`;
            customerMsg += `💰 *Subtotal:* ₹${subtotal}\n`;
            customerMsg += `🚚 *Delivery:* ₹${deliveryFee}\n`;
            customerMsg += `✅ *Total:* ₹${total} (Cash on Delivery)\n\n`;
            customerMsg += `📦 Your order is being prepared and our delivery partner will reach you soon! 🚀\n\n`;
            if (ownerPhone) {
                customerMsg += `📞 *For any queries contact:* +${ownerPhone}`;
            }
            await whatsappService.sendText(phone, customerMsg);

            // DELAY OWNER notification by 60 seconds
            // This gives the customer time to add forgotten items via the "Add More Items" flow
            if (ownerPhone) {
                setTimeout(async () => {
                    try {
                        // Re-fetch the order from DB to get the latest items (in case items were added)
                        const latestOrder = await Order.findOne({ orderId }).lean();
                        if (!latestOrder) return;

                        const mapsLink = (latestOrder.customer.latitude && latestOrder.customer.longitude) 
                            ? `https://maps.google.com/?q=${latestOrder.customer.latitude},${latestOrder.customer.longitude}` 
                            : 'Not provided';

                        // Rebuild items text from the latest order
                        let latestItemsText = '';
                        for (const item of latestOrder.items) {
                            latestItemsText += `${item.productName} (${item.variantName}) x ${item.quantity} - ₹${item.lineTotal}\n`;
                        }

                        let ownerMsg = `📦 *NEW ORDER RECEIVED!* 🔔\n`;
                        ownerMsg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
                        ownerMsg += `🆔 *Order ID:* ${latestOrder.orderId}\n`;
                        ownerMsg += `👤 *Customer:* ${latestOrder.customer.name}\n`;
                        ownerMsg += `📞 *Phone:* ${latestOrder.customer.phone}\n`;
                        ownerMsg += `📍 *Address:* ${latestOrder.customer.address}\n`;
                        ownerMsg += `🗺️ *Location:* ${mapsLink}\n`;
                        if (latestOrder.customer.distanceFromStore !== null) {
                            ownerMsg += `📏 *Distance:* ${latestOrder.customer.distanceFromStore} meters\n`;
                        }
                        ownerMsg += `\n🛍️ *Items Ordered:*\n${latestItemsText}\n`;
                        ownerMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
                        ownerMsg += `💰 *Subtotal:* ₹${latestOrder.subtotal}\n`;
                        ownerMsg += `🚚 *Delivery Fee:* ₹${latestOrder.deliveryFee}\n`;
                        ownerMsg += `✅ *Total:* ₹${latestOrder.total} (COD)\n`;
                        ownerMsg += `━━━━━━━━━━━━━━━━━━━━`;

                        await whatsappService.sendText(ownerPhone, ownerMsg);
                        console.log(`📨 Owner notification sent for order ${orderId} (after 60s delay)`);
                    } catch (delayErr) {
                        console.error('Failed to send delayed owner notification:', delayErr);
                    }
                }, 30000); // 30 second delay
            }

        } catch (err) {
            console.error('Failed to send WhatsApp notifications:', err);
        }
    })();

    res.status(201).json({ success: true, order: { orderId, total, status: newOrder.status } });

  } catch (err) {
    console.error('Order placement error:', err);
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

// PATCH /api/orders/:orderId/add-items — Add forgotten items to a recent order
router.patch('/orders/:orderId/add-items', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { cart } = req.body;

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ error: 'No items to add.' });
        }

        // Find the order — must be PENDING and created within last 2 minutes
        const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
        const order = await Order.findOne({ 
            orderId, 
            status: 'PENDING', 
            createdAt: { $gte: twoMinAgo } 
        });

        if (!order) {
            return res.status(400).json({ error: 'Order not found or modification window has expired.' });
        }

        // Verify and add items
        let addedSubtotal = 0;
        const newItems = [];

        for (const item of cart) {
            const product = await Product.findById(item.productId);
            if (!product || !product.isActive) continue;

            const variant = product.variants.id(item.variantId);
            if (!variant) continue;

            const lineTotal = variant.price * item.quantity;
            addedSubtotal += lineTotal;

            // Check if this exact product+variant already exists in the order
            const existingItem = order.items.find(
                i => i.productId.toString() === item.productId && i.variantId === item.variantId
            );

            if (existingItem) {
                // Increase quantity
                existingItem.quantity += item.quantity;
                existingItem.lineTotal += lineTotal;
            } else {
                // Add new item
                newItems.push({
                    productId: product._id,
                    productName: product.name,
                    variantId: variant._id.toString(),
                    variantName: variant.name,
                    price: variant.price,
                    quantity: item.quantity,
                    lineTotal
                });
            }
        }

        // Push new items
        if (newItems.length > 0) {
            order.items.push(...newItems);
        }

        // Recalculate totals
        order.subtotal += addedSubtotal;
        order.total = order.subtotal + order.deliveryFee;

        await order.save();

        console.log(`📝 Added items to order ${orderId}. New total: ₹${order.total}`);

        // Send updated confirmation to customer
        (async () => {
            try {
                let updateMsg = `📝 *Order Updated!*\n\n`;
                updateMsg += `Your order *${orderId}* has been updated with new items.\n\n`;
                updateMsg += `✅ *New Total:* ₹${order.total} (Cash on Delivery)\n\n`;
                updateMsg += `📦 We'll pack everything together! 💚`;
                
                await whatsappService.sendText(order.customer.phone, updateMsg);
            } catch (err) {
                console.error('Failed to send update notification:', err);
            }
        })();

        res.json({ success: true, order: { orderId, total: order.total, itemCount: order.items.length } });

    } catch (err) {
        console.error('Add items error:', err);
        res.status(500).json({ error: 'Failed to add items.' });
    }
});

// GET /api/orders/:orderId — Track order
router.get('/orders/:orderId', async (req, res) => {
    try {
        const { phone } = req.query; // basic verification
        const { orderId } = req.params;

        if (!phone) {
            return res.status(400).json({ error: 'Phone number required for tracking.' });
        }

        const order = await Order.findOne({ orderId, 'customer.phone': phone })
            .select('-statusHistory.changedBy -__v'); // hide internal details

        if (!order) {
            return res.status(404).json({ error: 'Order not found or phone number mismatch.' });
        }

        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order details.' });
    }
});

module.exports = router;

