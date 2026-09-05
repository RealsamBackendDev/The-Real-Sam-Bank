const rateLimit = require('express-rate-limit');

// General API Rate Limiter (e.g., 100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict Limiter for Sensitive Auth Routes (Login, Send OTP)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { message: "Too many authentication attempts, please try again in 10 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter };