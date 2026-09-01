const express = require("express");
const router = express.Router();
const {
  nameEnquiry,
  transfer,
  buyAirtime,
  buyData,
  getTransactionHistory
} = require("../controller/transactionController");
const { protect } = require("../middleware/auth");
const { transactionLimiter } = require("../middleware/rateLimit");

router.post("/name-enquiry", protect, nameEnquiry);
router.post("/send", protect, transactionLimiter, transfer);
router.post("/airtime", protect, transactionLimiter, buyAirtime);
router.post("/data", protect, transactionLimiter, buyData);
router.get("/history", protect, getTransactionHistory);

module.exports = router;