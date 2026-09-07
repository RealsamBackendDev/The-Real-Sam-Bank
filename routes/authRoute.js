const express = require('express');
const router = express.Router();
const authController = require('../controller/AuthController');
const { authLimiter, pinLimiter } = require('../middleware/rateLimit');
const protect = require('../middleware/auth');

router.post('/register', authLimiter, authController.registerUser);
router.post('/login', authLimiter, authController.loginUser);
router.post('/refresh', authController.refreshAccessToken);
router.post('/send-otp', authLimiter, authController.sendOtp);
router.post('/resend-otp', authLimiter, authController.resendOTP);
router.post('/verify-otp', authLimiter, authController.verifyOtp);
router.post('/set-pin', protect, authController.setTransactionPin);
router.post('/verify-pin', protect, pinLimiter, authController.verifyTransactionPin);
router.post('/logout', protect, authController.logoutUser);

module.exports = router;
