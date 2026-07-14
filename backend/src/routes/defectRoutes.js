const express = require('express');
const defectController = require('../controllers/defectController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { defectValidation } = require('../validators');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard/stats', defectController.getDashboardStats);
router.get('/reports', authorize('admin', 'manager', 'project_manager'), defectController.getReports);
router.get('/', defectController.getAllDefects);
router.get('/:id', defectController.getDefectById);
router.post('/', upload.single('screenshot'), defectValidation, validate, defectController.createDefect);
router.put('/:id', upload.single('screenshot'), defectController.updateDefect);
router.delete('/:id', authorize('admin'), defectController.deleteDefect);
router.post('/:id/attachments', upload.single('screenshot'), defectController.uploadAttachment);

module.exports = router;
