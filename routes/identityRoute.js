const express = require('express');
const router = express.Router();
const identityController = require('../controller/IdentityController'); 
const protect = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');


router.post('/insertBvn', protect, apiLimiter, identityController.createBvn);
router.post('/insertNin', protect, apiLimiter, identityController.createNin);
router.post('/validateBvn', protect, identityController.validateBvn);
router.post('/validateNin', protect, identityController.validateNin);


module.exports = router;
