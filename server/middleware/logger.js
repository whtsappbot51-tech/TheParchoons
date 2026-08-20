const fs = require('fs');
const path = require('path');

// Ensure log directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
const errorLogStream = fs.createWriteStream(path.join(logDir, 'error.log'), { flags: 'a' });

/**
 * Structured request logger middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || '',
    };
    
    const logString = JSON.stringify(logEntry) + '\n';
    
    // Log to file
    accessLogStream.write(logString);
    
    // Log errors to error log and console in production
    if (res.statusCode >= 400) {
      errorLogStream.write(logString);
      if (process.env.NODE_ENV === 'production') {
        console.error(`[${logEntry.timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      }
    }
  });

  next();
};

module.exports = requestLogger;
