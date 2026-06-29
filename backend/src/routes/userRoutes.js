const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateUserValidation } = require('../validators');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin'), userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', updateUserValidation, validate, userController.updateUser);

module.exports = router;
