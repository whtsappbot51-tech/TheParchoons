const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  address: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  isDefault: { type: Boolean, default: false },
});

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  addresses: [addressSchema],
  orderCount: {
    type: Number,
    default: 0,
  },
  lastOrderAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });



module.exports = mongoose.model('Customer', customerSchema);
