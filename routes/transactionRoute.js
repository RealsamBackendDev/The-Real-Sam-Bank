const express = require('express');
const router = express.Router();
const transactionController = require('../controller/transactionController');
const webhookController = require('../controller/WebhookController');
const { protect } = require('../middleware/auth');

router.get('/name-enquiry/:accountNumber', protect, transactionController.nameEnquiry);
router.post('/transfer', protect, transactionController.transferFunds);
router.post('/buy-airtime', protect, transactionController.buyAirtime);
router.post('/buy-data', protect, transactionController.buyData);
router.get('/status/:transactionId', protect, transactionController.getTransactionStatus);
router.get('/history', protect, transactionController.getUserTransactionHistory);

router.post('/webhook', webhookController.handleNibssWebhook);

module.exports = router;