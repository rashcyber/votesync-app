const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const lookupController = require('../controllers/lookupController');

// Rate limiter for lookup — 30 requests per min per IP
const lookupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: { message: 'Too many lookup requests. Please try again shortly.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/:code', lookupLimiter, lookupController.lookupByCode);

module.exports = router;
