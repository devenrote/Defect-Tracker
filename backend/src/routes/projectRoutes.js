const express = require('express');
const projectController = require('../controllers/projectController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { projectValidation } = require('../validators');

const router = express.Router();

router.use(authenticate);

router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.get('/:id/statistics', projectController.getProjectStatistics);
router.post('/', authorize('admin'), projectValidation, validate, projectController.createProject);
router.put('/:id', authorize('admin'), projectValidation, validate, projectController.updateProject);
router.delete('/:id', authorize('admin'), projectController.deleteProject);

// Project Member and Ownership management
router.get('/:id/members', projectController.getProjectMembers);
router.post('/:id/members', authorize('admin', 'manager', 'project_manager'), projectController.addProjectMember);
router.delete('/:id/members/:userId', authorize('admin', 'manager', 'project_manager'), projectController.removeProjectMember);
router.put('/:id/owner', authorize('admin'), projectController.transferOwnership);
router.put('/:id/manager', authorize('admin'), projectController.changeProjectManager);
router.get('/:id/activities', projectController.getProjectActivities);

module.exports = router;
