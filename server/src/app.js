const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { NODE_ENV, ALLOWED_ORIGINS } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Route imports
const adminRoutes = require('./routes/admin');
const electionRoutes = require('./routes/elections');
const positionRoutes = require('./routes/positions');
const candidateRoutes = require('./routes/candidates');
const voterRoutes = require('./routes/voters');
const votingRoutes = require('./routes/voting');
const resultRoutes = require('./routes/results');
const paymentRoutes = require('./routes/payments');
const lookupRoutes = require('./routes/lookup');
const auditRoutes = require('./routes/audit');
const verifyRoutes = require('./routes/verify');
const templateRoutes = require('./routes/templates');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const studentRoutes = require('./routes/students');
const adminUserRoutes = require('./routes/adminUsers');
const ussdRoutes = require('./routes/ussd');

const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false }));

// CORS with explicit origin whitelist
const allowedOrigins = ALLOWED_ORIGINS.split(',').map(o => o.trim());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In development, allow all origins
    if (NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Request logging (skip in test)
if (NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Body parsing - skip for webhook route (needs raw body for HMAC verification)
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') return next();
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// API routes
app.use('/api/admin', adminRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/ussd', ussdRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app in production
if (NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
