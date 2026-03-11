const express = require('express');
const router = express.Router();
const ussdController = require('../controllers/ussdController');

// Africa's Talking USSD callback — no auth required
router.post('/callback', ussdController.callback);

module.exports = router;
