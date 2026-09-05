const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    account_number: {
      type: String,
      required: true,
      trim: true
    },
    transaction_id: {
      type: String,
      required: true,
      unique: true
    },
    transaction_type: {
      type: String,
      enum: ['TRANSFER', 'DEPOSIT'],
      default: 'TRANSFER'
    },
    amount: {
      type: Number,
      required: true
    },
    to_account: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PENDING'],
      default: 'SUCCESS'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transactions', transactionSchema);