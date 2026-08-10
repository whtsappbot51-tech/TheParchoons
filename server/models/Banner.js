const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  image: {
    type: String,   // Cloudinary URL
    required: true,
  },
  ctaText: {
    type: String,
    default: 'Shop Now',
  },
  ctaLink: {
    type: String,
    default: '/',
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

bannerSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
