const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const voterController = require('../controllers/voterController');
const authAdmin = require('../middleware/authAdmin');
const { importUpload } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { voterLoginSchema, studentCreateSchema, codeGenerateSchema } = require('../validators/schemas');

// Rate limiter for voter login — 10 attempts per IP per 15 minutes
const voterLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: { message: 'Too many login attempts. Please try again in 15 minutes.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Voter login
router.post('/login', voterLoginLimiter, validate(voterLoginSchema), voterController.login);

// Student management (admin)
router.get('/students', authAdmin, voterController.listStudents);
router.get('/students/count', authAdmin, voterController.getStudentCount);
router.post('/students', authAdmin, validate(studentCreateSchema), voterController.createStudent);
router.put('/students/:id', authAdmin, voterController.updateStudent);
router.delete('/students/:id', authAdmin, voterController.removeStudent);

// Student import (admin)
router.post('/students/import', authAdmin, importUpload.single('file'), voterController.importStudents);
router.post('/students/import/confirm', authAdmin, voterController.confirmImport);

// Voter code management (admin)
router.post('/elections/:electionId/codes/generate', authAdmin, validate(codeGenerateSchema), voterController.generateCodes);
router.get('/elections/:electionId/codes', authAdmin, voterController.listCodes);
router.get('/elections/:electionId/codes/export-pdf', authAdmin, voterController.exportCodesPDF);
router.delete('/elections/:electionId/codes/:codeId', authAdmin, voterController.deleteCode);
router.delete('/elections/:electionId/codes', authAdmin, voterController.revokeUnusedCodes);

module.exports = router;
