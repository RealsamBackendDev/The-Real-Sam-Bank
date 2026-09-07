const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../model/userModel');
const { sendOtpEmail } = require('../services/emailServices');
const { sendOtpSms } = require('../services/smsService');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

async function dispatchOtp(user) {
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();
  await Promise.allSettled([
    sendOtpEmail(user.email, otp),
    sendOtpSms(user.phone, otp)
  ]);
}

exports.registerUser = async (req, res) => {
  try {
    const { first_name, middle_name, last_name, email, password, phone } = req.body;
    if (!first_name || !last_name || !email || !password || !phone) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(409).json({ message: "Email already exists" });
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(409).json({ message: "Phone number already exists" });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      first_name, middle_name: middle_name || null, last_name, email,
      password: hashedPassword, phone, role: 'customer'
    });

    await newUser.save();
    await dispatchOtp(newUser);

    const userResponse = await User.findById(newUser._id)
      .select('-password -otp -otpExpires -transactionPin -refreshToken');

    res.status(201).json({
      message: "User registered successfully. OTP sent to email and phone.",
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    await dispatchOtp(user);
    res.status(200).json({ message: "OTP sent successfully to email and phone" });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP", error: error.message });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    await dispatchOtp(user);
    res.status(200).json({ message: "New OTP sent successfully to email and phone" });
  } catch (error) {
    res.status(500).json({ message: "Error resending OTP", error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.otp || String(user.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.otpExpires && new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying OTP", error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return res.status(401).json({ message: "Invalid credentials" });
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not defined');

    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role || 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    user.refreshToken = refreshToken;
    user.refreshTokenExpires = refreshTokenExpires;
    await user.save();

    const userResponse = await User.findById(user._id)
      .select('-password -otp -otpExpires -transactionPin -refreshToken');

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token is required" });
    const user = await User.findOne({ refreshToken });
    if (!user || !user.refreshTokenExpires || new Date() > user.refreshTokenExpires) {
      return res.status(401).json({ message: "Invalid or expired refresh token. Please log in again." });
    }
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role || 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.status(200).json({ message: "Token refreshed successfully", accessToken, expiresIn: 900 });
  } catch (error) {
    res.status(500).json({ message: "Error refreshing token", error: error.message });
  }
};

exports.setTransactionPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const userId = req.user.id;
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ message: "Pin must be exactly 4 digits" });
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPin = await bcrypt.hash(pin, salt);
    await User.findByIdAndUpdate(userId, { transactionPin: hashedPin });
    res.status(200).json({ message: "Transaction PIN configured successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error setting transaction PIN", error: error.message });
  }
};

exports.verifyTransactionPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const userId = req.user.id;
    if (!pin) return res.status(400).json({ message: "PIN is required" });
    const user = await User.findById(userId);
    if (!user || !user.transactionPin) return res.status(400).json({ message: "Transaction PIN not set" });
    const isMatch = await bcrypt.compare(pin, user.transactionPin);
    if (!isMatch) return res.status(401).json({ message: "Invalid transaction PIN" });
    res.status(200).json({ message: "PIN verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying PIN", error: error.message });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshToken: null, refreshTokenExpires: null });
    }
    res.status(200).json({ message: "Logout successful. Please delete your tokens on the client." });
  } catch (error) {
    res.status(500).json({ message: "Error logging out", error: error.message });
  }
};
