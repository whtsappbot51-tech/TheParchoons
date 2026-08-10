const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/auth.routes');
const catalogRoutes = require('./routes/catalog.routes');
const orderRoutes = require('./routes/order.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadRoutes = require('./routes/upload.routes');
const webhookRoutes = require('./routes/webhook.routes');

const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors());

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend builds
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Log requests in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    next();
  });
}

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', uploadRoutes);
app.use('/', webhookRoutes);

// --- SPA Fallback ---
// For client-side routing: serve index.html for any non-API, non-admin route
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/webhook')) return next();
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// --- Start Server ---
const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    // Create default admin if none exists
    const Admin = require('./models/Admin');
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        email: config.admin.defaultEmail,
        password: config.admin.defaultPassword,
        name: 'TheParchoons Admin',
        role: 'superadmin',
      });
      console.log(`✅ Default admin created: ${config.admin.defaultEmail}`);
    }

    // Auto-detect server URL
    app.use((req, res, next) => {
      if (!config.serverUrl && req.get('host')) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        config.serverUrl = `${protocol}://${req.get('host')}`;
      }
      next();
    });

    app.listen(config.port, () => {
      console.log(`\n🚀 ══════════════════════════════════════════════`);
      console.log(`🚀  TheParchoons Server is running!`);
      console.log(`🚀  Local:   http://localhost:${config.port}`);
      console.log(`🚀  Webhook: http://localhost:${config.port}/webhook`);
      console.log(`🚀  Admin:   http://localhost:${config.port}/admin`);
      console.log(`🚀 ══════════════════════════════════════════════\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
