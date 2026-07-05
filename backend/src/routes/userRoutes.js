const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateUserValidation } = require('../validators');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', authorize('admin'), userController.createUser);
router.put('/:id', upload.single('avatar'), updateUserValidation, validate, userController.updateUser);

module.exports = router;
