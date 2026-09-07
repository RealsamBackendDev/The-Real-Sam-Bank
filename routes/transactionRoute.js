const express = require('express');
const router = express.Router();
const transactionController = require('../controller/transactionController');
const protect = require('../middleware/auth');
const { transferLimiter } = require('../middleware/rateLimit');

router.get('/name-enquiry/:accountNumber', protect, transactionController.nameEnquiry);
router.post('/transfer', protect, transferLimiter, transactionController.transferFunds);
router.post('/reverse/:transactionId', protect, transactionController.reverseTransaction);
router.post('/buy-airtime', protect, transferLimiter, transactionController.buyAirtime);
router.post('/buy-data', protect, transferLimiter, transactionController.buyData);
router.get('/status/:transactionId', protect, transactionController.getTransactionStatus);
router.get('/history', protect, transactionController.getUserTransactionHistory);

module.exports = router;
