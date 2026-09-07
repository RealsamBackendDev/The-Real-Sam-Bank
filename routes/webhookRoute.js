const express = require('express'); const router = express.Router();
const webhookController = require('../controller/WebhookController');

router.post('/nibss', webhookController.handleNibssWebhook);

module.exports = router
