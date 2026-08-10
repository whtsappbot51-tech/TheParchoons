const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,    // e.g. "5 kg", "1 L", "250 g"
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  mrp: {
    type: Number,  // Original MRP for showing discount strikethrough
    default: 0,
  },
  sku: {
    type: String,
    default: '',
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  image: {
    type: String,
    default: '',
  },
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  brand: {
    type: String,
    default: '',
    trim: true,
  },
  image: {
    type: String,   // Cloudinary URL
    default: '',
  },
  variants: {
    type: [variantSchema],
    validate: [arr => arr.length > 0, 'Product must have at least one variant.'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isBestSeller: {
    type: Boolean,
    default: false,
  },
  isOnOffer: {
    type: Boolean,
    default: false,
  },
  offerText: {
    type: String,
    default: '',   // e.g. "10% OFF"
  },
}, { timestamps: true });

// Text index for search by name and brand
productSchema.index({ name: 'text', brand: 'text' });

// Compound index for common queries
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ isBestSeller: 1, isActive: 1 });
productSchema.index({ isOnOffer: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
