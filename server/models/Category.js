const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,   // Cloudinary URL
    default: '',
  },
  emoji: {
    type: String,
    default: '🛒',
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

// Index for sorting and filtering
categorySchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);
