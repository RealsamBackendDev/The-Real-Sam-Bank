const express = require('express');
const router = express.Router();
const identityController = require('../controller/IdentityController');
const protect = require('../middleware/auth');

router.post('/insertBvn', protect, identityController.createBvn);
router.post('/insertNin', protect, identityController.createNin);
router.post('/validateBvn', protect, identityController.validateBvn);
router.post('/validateNin', protect, identityController.validateNin);

module.exports = router;