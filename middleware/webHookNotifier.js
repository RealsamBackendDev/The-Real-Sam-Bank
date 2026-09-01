const axios = require("axios");

exports.dispatchWebhook = async (event, transactionData) => {
  const webhookUrl = process.env.WEBHOOK_LISTENER_URL;
  if (!webhookUrl) return;

  try {
    await axios.post(
      webhookUrl,
      {
        event,
        timestamp: new Date(),
        data: transactionData
      },
      {
        headers: { "X-Bank-Signature": process.env.WEBHOOK_SECRET || "sam-bank-secret" },
        timeout: 5000
      }
    );
  } catch (error) {
    console.error(`Webhook notification error (${event}):`, error.message);
  }
};