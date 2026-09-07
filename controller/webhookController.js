const crypto = require('crypto');
const Transaction = require('../model/transactionModel');
const User = require('../model/userModel');

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret-key';

function verifySignature(payload, signature) {
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    if (!signature) {
      return res.status(401).json({ message: "Missing webhook signature" });
    }

    const { event, data } = req.body;
    if (!event || !data) {
      return res.status(400).json({ message: "event and data are required" });
    }

    if (!verifySignature(req.body, signature)) {
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    if (event === 'credit.alert') {
      const { transactionId, accountNumber, amount, fromAccount, senderName } = data;

      const user = await User.findOne({ accountNumber });
      if (!user) {
        return res.status(200).json({ status: 'ignored', message: 'Account not found in local system' });
      }

      const existing = await Transaction.findOne({ transactionId });
      if (existing) {
        return res.status(200).json({ status: 'duplicate', message: 'Transaction already processed' });
      }

      await Transaction.create({
        user: user._id,
        accountNumber,
        transactionId,
        transactionType: 'DEPOSIT',
        amount: Number(amount),
        fromAccount: fromAccount || null,
        senderName: senderName || null,
        toAccount: accountNumber,
        status: 'SUCCESS'
      });

      return res.status(200).json({ status: 'success', message: 'Credit alert processed' });
    }

    if (event === 'purchase.success') {
      const { transactionId, accountNumber, amount, type, details } = data;

      const transaction = await Transaction.findOne({ transactionId });
      if (!transaction) {
        return res.status(404).json({ status: 'error', message: 'Transaction not found' });
      }

      if (transaction.status === 'SUCCESS') {
        return res.status(200).json({ status: 'duplicate', message: 'Purchase already confirmed' });
      }

      transaction.status = 'SUCCESS';
      transaction.meta = { ...transaction.meta, ...details };
      await transaction.save();

      return res.status(200).json({ status: 'success', message: `${type} purchase confirmed` });
    }

    if (event === 'purchase.failed') {
      const { transactionId, reason } = data;

      const transaction = await Transaction.findOne({ transactionId });
      if (!transaction) {
        return res.status(404).json({ status: 'error', message: 'Transaction not found' });
      }

      transaction.status = 'FAILED';
      transaction.meta = { ...transaction.meta, failureReason: reason };
      await transaction.save();

      return res.status(200).json({ status: 'success', message: 'Purchase failure recorded' });
    }

    res.status(400).json({ status: 'ignored', message: `Unhandled event type: ${event}` });
  } catch (error) {
    console.error('Webhook Error:', error.message);
    res.status(500).json({ status: 'error', message: 'Internal webhook processing error' });
  }
};
