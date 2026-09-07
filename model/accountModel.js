const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    bankCode: {
      type: String,
      required: true
    },
    bankName: {
      type: String,
      required: true
    },
    kycType: {
      type: String,
      enum: ['bvn', 'nin'],
      required: true
    },
    kycID: {
      type: String,
      required: true
    },
    dob: {
      type: String,
      required: true
    },
    balance: {
      type: Number,
      default: 15000
    },
    accountStatus: {
      type: String,
      enum: ['active', 'dormant', 'suspended', 'closed'],
      default: 'active'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Account || mongoose.model('Account', accountSchema);
