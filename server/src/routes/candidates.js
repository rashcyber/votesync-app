const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const authAdmin = require('../middleware/authAdmin');
const { candidateUpload } = require('../middleware/upload');

// Note: candidate create/update use multipart form data (photo upload),
// so Zod validation is applied inside the controller after multer processes the file

router.get('/position/:positionId', candidateController.listByPosition);
router.get('/election/:electionId', candidateController.listByElection);
router.post('/election/:electionId', authAdmin, candidateUpload.single('photo'), candidateController.create);
router.put('/:id', authAdmin, candidateUpload.single('photo'), candidateController.update);
router.delete('/:id', authAdmin, candidateController.remove);

module.exports = router;
