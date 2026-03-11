const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const votingController = require('../controllers/votingController');
const authVoter = require('../middleware/authVoter');
const validate = require('../middleware/validate');
const { voteCastSchema, paidVoteCastSchema } = require('../validators/schemas');

// Rate limiter for vote submission — 5 requests per min per IP
const voteSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: { message: 'Too many vote attempts. Please wait a moment.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/elections/:id/ballot', authVoter, votingController.getBallot);
router.post('/elections/:id/vote', authVoter, voteSubmitLimiter, validate(voteCastSchema), votingController.castFreeVote);
router.post('/elections/:id/vote/paid', voteSubmitLimiter, validate(paidVoteCastSchema), votingController.castPaidVote);

module.exports = router;
