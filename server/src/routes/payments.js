const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authAdmin = require('../middleware/authAdmin');
const validate = require('../middleware/validate');
const { paymentInitSchema } = require('../validators/schemas');

// Rate limiter for payment initialization — 10 requests per 15 min per IP
const paymentInitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: { message: 'Too many payment requests. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/initialize', paymentInitLimiter, validate(paymentInitSchema), paymentController.initialize);
router.get('/verify/:reference', paymentController.verify);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);
router.post('/:id/approve', authAdmin, paymentController.approveManual);
router.get('/election/:electionId', authAdmin, paymentController.listByElection);

module.exports = router;
