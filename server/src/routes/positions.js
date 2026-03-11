const express = require('express');
const router = express.Router();
const positionController = require('../controllers/positionController');
const authAdmin = require('../middleware/authAdmin');
const validate = require('../middleware/validate');
const { positionCreateSchema, positionUpdateSchema } = require('../validators/schemas');

router.get('/election/:electionId', positionController.listByElection);
router.post('/election/:electionId', authAdmin, validate(positionCreateSchema), positionController.create);
router.put('/:id', authAdmin, validate(positionUpdateSchema), positionController.update);
router.delete('/:id', authAdmin, positionController.remove);

module.exports = router;
