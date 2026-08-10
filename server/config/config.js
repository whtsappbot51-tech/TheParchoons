const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  serverUrl: process.env.SERVER_URL || null,

  // Database
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/theparchoons',

  // Auth
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
    expiresIn: '7d',
  },
  admin: {
    defaultEmail: process.env.ADMIN_DEFAULT_EMAIL || 'admin@theparchoons.com',
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'admin123',
  },

  // WhatsApp
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.PHONE_NUMBER_ID,
    verifyToken: process.env.VERIFY_TOKEN || 'theparchoons_verify_token_123',
    ownerPhone: process.env.OWNER_PHONE,
    botPhone: process.env.BOT_PHONE || '919999999999',
    apiVersion: 'v19.0',
  },

  // Store Location & Delivery
  store: {
    latitude: parseFloat(process.env.STORE_LATITUDE) || 0,
    longitude: parseFloat(process.env.STORE_LONGITUDE) || 0,
    deliveryRadiusMeters: parseInt(process.env.DELIVERY_RADIUS_METERS) || 500,
    deliveryFee: parseFloat(process.env.DELIVERY_FEE) || 0,
    freeDeliveryAbove: parseFloat(process.env.FREE_DELIVERY_ABOVE) || 0,
    minOrderAmount: parseFloat(process.env.MIN_ORDER_AMOUNT) || 0,
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Razorpay (future)
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
};

module.exports = config;
