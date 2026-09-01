const rateLimit = require("express-rate-limit");


exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per IP
  message: { error: "Too many login/auth attempts from this IP. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

// Transaction Financial Limiter (Prevents rapid double-submit on transfers, airtime, and data)
exports.transactionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 5, // Max 5 transactions per minute per IP
  message: { error: "Transaction limit reached. Please wait a minute before making another request." },
  standardHeaders: true,
  legacyHeaders: false
});