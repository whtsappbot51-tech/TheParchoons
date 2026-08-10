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

    // 7. Send WhatsApp Notifications (Async, don't block response)
    (async () => {
        try {
            const ownerPhone = config.whatsapp.ownerPhone;
            if (ownerPhone) {
                const mapsLink = (customerLat && customerLon) ? `https://maps.google.com/?q=${customerLat},${customerLon}` : 'Not provided';
                
                let ownerMsg = `🛒 *NEW ORDER RECEIVED*\n\n`;
                ownerMsg += `*Order ID:* ${orderId}\n`;
                ownerMsg += `*Customer:* ${name}\n`;
                ownerMsg += `*Phone:* ${phone}\n`;
                ownerMsg += `*Address:* ${address}\n`;
                ownerMsg += `*Location:* ${mapsLink}\n`;
                if(distanceFromStore !== null) {
                    ownerMsg += `*Distance:* ${distanceFromStore} meters\n`;
                }
                ownerMsg += `\n*Items:*\n${itemsText}\n`;
                ownerMsg += `*Subtotal:* ₹${subtotal}\n`;
                ownerMsg += `*Delivery Fee:* ₹${deliveryFee}\n`;
                ownerMsg += `*Total:* ₹${total} (COD)\n`;

                await whatsappService.sendText(ownerPhone, ownerMsg);
            }

            // Customer confirmation
            let customerMsg = `🎉 *Thank you for your order, ${name}!*\n\n`;
            customerMsg += `Your order *${orderId}* has been placed successfully.\n\n`;
            customerMsg += `*Total Amount:* ₹${total} (Cash on Delivery)\n\n`;
            customerMsg += `Our team will contact you shortly regarding delivery.\n`;
            customerMsg += `- TheParchoons`;

            await whatsappService.sendText(phone, customerMsg);

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
