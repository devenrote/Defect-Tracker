const express = require('express');
const publicController = require('../controllers/publicController');
const router = express.Router();

router.get('/public/stats', publicController.getStats);
router.post('/contact', publicController.createContactMessage);

module.exports = router;
