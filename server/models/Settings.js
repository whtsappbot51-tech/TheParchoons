const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  value: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',   // Human-readable label for admin UI
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'text'],
    default: 'string',
  },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
