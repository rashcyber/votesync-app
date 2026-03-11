const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authAdmin = require('../middleware/authAdmin');
const validate = require('../middleware/validate');
const { adminLoginSchema } = require('../validators/schemas');
const { NODE_ENV } = require('../config/env');

// Rate limiter for admin login — disabled in development, 10 attempts per IP per 15 minutes in production
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 10 : 100,
  message: { error: { message: 'Too many login attempts. Please try again in 15 minutes.' } },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => NODE_ENV !== 'production',
});

router.post('/login', adminLoginLimiter, validate(adminLoginSchema), adminController.login);
router.get('/me', authAdmin, adminController.getMe);

module.exports = router;
