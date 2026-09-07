const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accountNumber: { type: String, required: true, trim: true },
    transactionId: { type: String, required: true, unique: true },
    idempotencyKey: { type: String, default: null, unique: true, sparse: true },
    transactionType: { type: String, enum: ['TRANSFER', 'DEPOSIT', 'AIRTIME', 'DATA', 'REVERSAL'], default: 'TRANSFER' },
    amount: { type: Number, required: true },
    toAccount: { type: String, required: true },
    fromAccount: { type: String, default: null },
    recipientName: { type: String, default: null },
    senderName: { type: String, default: null },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'PENDING', 'REVERSED'], default: 'PENDING' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
