const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const authAdmin = require('../middleware/authAdmin');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { adminCreateSchema, adminUpdateSchema } = require('../validators/schemas');

// All routes require super_admin
router.use(authAdmin, requireRole('super_admin'));

router.get('/', adminUserController.list);
router.get('/:id', adminUserController.getById);
router.post('/', validate(adminCreateSchema), adminUserController.create);
router.put('/:id', validate(adminUpdateSchema), adminUserController.update);
router.delete('/:id', adminUserController.remove);

module.exports = router;
