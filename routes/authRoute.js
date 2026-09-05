// Src/Routes/AuthRoute.js
const express = require('express');
const router = express.Router();
const authController = require('../controller/AuthController');
const { authLimiter } = require('../middleware/rateLimit');
const protect  = require('../middleware/auth');


router.post('/register', authController.registerUser);
router.post('/login', authLimiter, authController.loginUser);
router.post('/send-otp', authLimiter, authController.sendOtp);
router.post('/resend-otp', authLimiter, authController.resendOTP);
router.post('/verify-otp', authController.verifyOtp);
router.post('/set-pin', protect, authController.setTransactionPin);
router.post('/verify-pin', protect, authController.verifyTransactionPin);
router.post('/logout', authController.logoutUser);

module.exports = router;