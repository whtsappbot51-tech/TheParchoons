const NodeCache = require('node-cache');

// TTL in seconds
const cache = new NodeCache({
  stdTTL: 300,       // 5 minutes default
  checkperiod: 60,   // Check for expired keys every 60s
  useClones: false,   // Return references (faster for read-heavy)
});

const cacheService = {
  /**
   * Get a value from cache.
   */
  get(key) {
    return cache.get(key);
  },

  /**
   * Set a value in cache with optional TTL override.
   */
  set(key, value, ttlSeconds) {
    if (ttlSeconds) {
      cache.set(key, value, ttlSeconds);
    } else {
      cache.set(key, value);
    }
  },

  /**
   * Delete a specific cache key.
   */
  del(key) {
    cache.del(key);
  },

  /**
   * Flush all cache entries (e.g., on admin bulk operations).
   */
  flush() {
    cache.flushAll();
  },

  /**
   * Invalidate all product-related cache keys.
   */
  invalidateProducts() {
    const keys = cache.keys().filter(k => k.startsWith('products'));
    if (keys.length > 0) cache.del(keys);
  },

  /**
   * Invalidate all category-related cache keys.
   */
  invalidateCategories() {
    cache.del('categories');
  },

  /**
   * Invalidate banner cache.
   */
  invalidateBanners() {
    cache.del('banners');
  },

  /**
   * Invalidate settings cache.
   */
  invalidateSettings() {
    cache.del('settings:public');
  },

  /**
   * Get cache stats for monitoring.
   */
  getStats() {
    return cache.getStats();
  },
};

module.exports = cacheService;
