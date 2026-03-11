const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authAdmin = require('../middleware/authAdmin');

router.get('/elections/:id/timeline', authAdmin, analyticsController.timeline);
router.get('/elections/:id/demographics', authAdmin, analyticsController.demographics);

module.exports = router;
