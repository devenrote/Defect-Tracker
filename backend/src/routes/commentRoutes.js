const express = require('express');
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { commentValidation } = require('../validators');

const router = express.Router();

router.use(authenticate);

router.get('/:defectId', commentController.getComments);
router.post('/', commentValidation, validate, commentController.createComment);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
