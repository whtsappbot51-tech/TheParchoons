const Order = require('../models/Order');
const crypto = require('crypto');

const orderService = {
  /**
   * Generates a unique human-readable Order ID in format: TP-YYYYMMDD-XXXX
   * Uses a random suffix to avoid race conditions under concurrent requests.
   */
  async generateOrderId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    // Use random 4-char hex suffix instead of sequential count (race-safe)
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();

    const orderId = `TP-${dateStr}-${randomSuffix}`;

    // Check for collision (extremely unlikely but safe)
    const exists = await Order.findOne({ orderId }).lean();
    if (exists) {
      // Retry with different random
      return this.generateOrderId();
    }

    return orderId;
  },
};

module.exports = orderService;
