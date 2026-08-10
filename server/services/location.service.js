const config = require('../config/config');
const Settings = require('../models/Settings');

/**
 * Calculates the distance between two GPS coordinates using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters, rounded
}

const locationService = {
  /**
   * Calculates distance from store to a given point.
   * Uses store coordinates from DB settings first, then falls back to env config.
   */
  async getDistanceFromStore(customerLat, customerLon) {
    let storeLat = config.store.latitude;
    let storeLon = config.store.longitude;

    // Try to get store coords from DB settings (admin can override)
    try {
      const latSetting = await Settings.findOne({ key: 'STORE_LATITUDE' });
      const lonSetting = await Settings.findOne({ key: 'STORE_LONGITUDE' });
      if (latSetting && latSetting.value) storeLat = parseFloat(latSetting.value);
      if (lonSetting && lonSetting.value) storeLon = parseFloat(lonSetting.value);
    } catch (err) {
      // Fall back to env config
    }

    if (!storeLat || !storeLon) {
      return { distance: null, withinRadius: true, radiusMeters: 0 };
    }

    const distance = calculateDistance(storeLat, storeLon, customerLat, customerLon);

    // Get delivery radius from DB settings or env
    let radiusMeters = config.store.deliveryRadiusMeters;
    try {
      const radiusSetting = await Settings.findOne({ key: 'DELIVERY_RADIUS_METERS' });
      if (radiusSetting && radiusSetting.value) {
        radiusMeters = parseInt(radiusSetting.value);
      }
    } catch (err) {
      // Fall back to env config
    }

    return {
      distance,
      withinRadius: distance <= radiusMeters,
      radiusMeters,
    };
  },

  /**
   * Simple distance calculation without DB lookup (for quick checks).
   */
  calculateDistance,
};

module.exports = locationService;
