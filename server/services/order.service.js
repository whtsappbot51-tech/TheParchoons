const Order = require('../models/Order');

const orderService = {
  /**
   * Generates a unique human-readable Order ID in format: TP-YYYYMMDD-NNNN
   */
  async generateOrderId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');  // 20260810

    // Count today's orders to generate sequential number
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todayCount = await Order.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    const sequentialNum = String(todayCount + 1).padStart(4, '0');
    return `TP-${dateStr}-${sequentialNum}`;
  },
};

module.exports = orderService;
