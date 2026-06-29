const { body } = require('express-validator');

const registerValidation = [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['super_admin', 'admin', 'project_manager', 'developer', 'tester']).withMessage('Invalid role'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const projectValidation = [
  body('project_name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'completed', 'archived']),
];

const defectValidation = [
  body('project_id').toInt().isInt().withMessage('Valid project ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('severity').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
  body('status').optional().isIn(['Open', 'Assigned', 'In Progress', 'Resolved', 'Verified', 'Closed']),
  body('assigned_to').optional({ values: 'falsy' }).toInt().isInt(),
];

const commentValidation = [
  body('defect_id').toInt().isInt().withMessage('Valid defect ID is required'),
  body('comment').trim().notEmpty().withMessage('Comment is required'),
];

const updateUserValidation = [
  body('full_name').optional().trim().notEmpty(),
  body('email').optional().trim().isEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'tester', 'developer']),
];

module.exports = {
  registerValidation,
  loginValidation,
  projectValidation,
  defectValidation,
  commentValidation,
  updateUserValidation,
};
