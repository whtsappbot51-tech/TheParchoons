const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'SETTINGS_UPDATE'],
  },
  resource: {
    type: String,
    required: true, // e.g. 'product', 'category', 'banner', 'order', 'settings'
  },
  resourceId: {
    type: String,
    default: '',
  },
  adminEmail: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    default: '',
  },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
