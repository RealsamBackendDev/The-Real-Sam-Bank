const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyOTP,
  resendOTP,
  refreshToken,
  logout
} = require("../controller/authController");
const { authLimiter } = require("../middleware/rateLimit");

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

module.exports = router;