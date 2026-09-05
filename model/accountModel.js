const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true 
    },
    account_number: {
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
      enum: ['BVN', 'NIN'],
      required: true
    },
    kycID: {
      type: String,
      required: true
    },
    balance: {
      type: Number,
      default: 15000 
    }
  },
  { timestamps: true }
);


// USE THIS INSTEAD:
module.exports = mongoose.models.Account || mongoose.model('Account', accountSchema);