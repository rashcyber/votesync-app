const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const authAdmin = require('../middleware/authAdmin');

router.get('/elections/:id', resultController.getResults);
router.get('/elections/:id/stats', authAdmin, resultController.getStats);
router.get('/elections/:id/export', authAdmin, resultController.exportResults);

module.exports = router;
