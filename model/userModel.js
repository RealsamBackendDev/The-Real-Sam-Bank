const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true
    },
    last_name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    otp: {
      type: String,
      default: null
    },
    otpExpires: {
      type: Date,
      default: null
    },
    resendOtp: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);