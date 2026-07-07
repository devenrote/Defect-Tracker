const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { registerValidation, loginValidation } = require('../validators');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);

router.get('/public-stats', authController.getPublicStats);
router.post('/contact-inquiry', authController.createInquiry);

router.put('/change-password', authenticate, authController.changePassword);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/session-info', authenticate, authController.getSessionInfo);

module.exports = router;
