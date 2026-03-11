const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authAdmin = require('../middleware/authAdmin');
const validate = require('../middleware/validate');
const { templateCreateSchema } = require('../validators/schemas');

router.get('/', authAdmin, templateController.list);
router.post('/', authAdmin, validate(templateCreateSchema), templateController.create);
router.delete('/:id', authAdmin, templateController.remove);

module.exports = router;
