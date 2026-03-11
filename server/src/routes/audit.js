const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authAdmin = require('../middleware/authAdmin');
const requireRole = require('../middleware/requireRole');

router.get('/', authAdmin, requireRole('super_admin'), auditController.listLogs);

module.exports = router;
