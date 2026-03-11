const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');

router.get('/:hash', verifyController.verifyReceipt);

module.exports = router;
