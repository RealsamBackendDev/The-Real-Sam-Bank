const express = require('express');
const router = express.Router();
const authController = require('../controller/AuthController');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authController.registerUser);
router.post('/login', authLimiter, authController.loginUser);
router.post('/send-otp', authLimiter, authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/logout', authController.logoutUser);

module.exports = router;