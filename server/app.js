const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const config = require('./config/config');
const { generalLimiter, sensitiveLimiter } = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const catalogRoutes = require('./routes/catalog.routes');
const orderRoutes = require('./routes/order.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadRoutes = require('./routes/upload.routes');
const webhookRoutes = require('./routes/webhook.routes');

const app = express();

// --- Request Logging ---
app.use(requestLogger);

// --- Security ---
app.use(helmet({
  contentSecurityPolicy: config.isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS — locked to allowed origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// --- Compression ---
app.use(compression());

// --- Body parsing with size limits ---
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- Rate limiting ---
app.use('/api', generalLimiter);
app.use('/api/auth/login', sensitiveLimiter);
app.use('/api/orders', sensitiveLimiter);

// Serve static frontend builds
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Log requests in development
if (!config.isProduction) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });
}

// --- API Routes ---
app.get('/ping', (req, res) => res.status(200).send('pong'));
app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', uploadRoutes);
app.use('/', webhookRoutes);

// --- SPA Fallback ---
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/webhook')) return next();
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, error: 'Origin not allowed.' });
  }
  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, error: 'File too large. Maximum 5MB allowed.' });
  }

  console.error('❌ Unhandled Error:', config.isProduction ? err.message : err);
  res.status(500).json({
    success: false,
    error: config.isProduction ? 'Something went wrong.' : err.message,
  });
});

// --- Start Server ---
const startServer = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Create default admin if none exists
    const Admin = require('./models/Admin');
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0 && config.admin.defaultEmail && config.admin.defaultPassword) {
      await Admin.create({
        email: config.admin.defaultEmail,
        password: config.admin.defaultPassword,
        name: 'TheParchoons Admin',
        role: 'superadmin',
      });
      console.log(`✅ Default admin created: ${config.admin.defaultEmail}`);
    }

    app.listen(config.port, () => {
      console.log(`\n🚀 ══════════════════════════════════════════════`);
      console.log(`🚀  TheParchoons Server is running!`);
      console.log(`🚀  Environment: ${config.nodeEnv}`);
      console.log(`🚀  Local:   http://localhost:${config.port}`);
      console.log(`🚀 ══════════════════════════════════════════════\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
