const express = require('express');
const router = express.Router();
const electionController = require('../controllers/electionController');
const authAdmin = require('../middleware/authAdmin');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { electionCreateSchema, electionUpdateSchema, electionStatusSchema, duplicateElectionSchema } = require('../validators/schemas');

router.get('/', electionController.list);
router.get('/:id', electionController.getById);
router.post('/', authAdmin, validate(electionCreateSchema), electionController.create);
router.put('/:id', authAdmin, validate(electionUpdateSchema), electionController.update);
router.patch('/:id/status', authAdmin, validate(electionStatusSchema), electionController.updateStatus);
router.delete('/:id', authAdmin, requireRole('super_admin'), electionController.remove);

// QR code
router.get('/:id/qrcode', authAdmin, electionController.getQRCode);

// Duplicate
router.post('/:id/duplicate', authAdmin, validate(duplicateElectionSchema), electionController.duplicate);

module.exports = router;
