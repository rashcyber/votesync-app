const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authAdmin = require('../middleware/authAdmin');

// Public route - get all notifications for landing page
router.get('/public/notifications', notificationController.listPublic);

// Admin routes - election specific
router.get('/elections/:electionId/notifications', authAdmin, notificationController.list);
router.post('/elections/:electionId/notifications', authAdmin, notificationController.create);

// Admin routes - general announcements (no election)
router.post('/announcements', authAdmin, notificationController.createAnnouncement);

router.delete('/notifications/:id', authAdmin, notificationController.remove);

module.exports = router;
