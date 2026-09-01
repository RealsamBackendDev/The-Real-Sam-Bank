// utils/webhookNotifier.js
const axios = require("axios");

exports.dispatchWebhook = async (event, transactionData) => {
  const webhookUrl = process.env.WEBHOOK_LISTENER_URL; // e.g. client callback URL or notification service
  if (!webhookUrl) return;

  try {
    await axios.post(
      webhookUrl,
      {
        event, // e.g., 'TRANSACTION.SUCCESS', 'TRANSFER.COMPLETED'
        timestamp: new Date(),
        data: transactionData
      },
      {
        headers: { "X-Bank-Signature": process.env.WEBHOOK_SECRET || "sam-bank-secret" },
        timeout: 5000
      }
    );
  } catch (error) {
    console.error(`Webhook delivery failed for event ${event}:`, error.message);
  }
};

