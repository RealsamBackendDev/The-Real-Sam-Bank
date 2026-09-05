const express = require('express');
const router = express.Router();
const onboardingController = require('../controller/onboardingController');

router.post('/fintech/onboard', onboardingController.onboardFintech);
router.post('/auth/token', onboardingController.getFintechToken);

module.exports = router;