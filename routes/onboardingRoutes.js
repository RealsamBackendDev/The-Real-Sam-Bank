const express = require('express'); 
const router = express.Router();
const onboardingController = require('../controller/onboardingController');
const protect = require('../middleware/auth'); 
const { authLimiter } = require('../middleware/rateLimit');

router.post('/fintech/onboard', protect, authLimiter, onboardingController.onboardFintech); 
router.post('/auth/token', protect, authLimiter, onboardingController.getFintechToken);

module.exports = router;
