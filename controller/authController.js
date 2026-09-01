const User = require("../model/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

// Helper: Generate Short-Lived Access Token (15 minutes)
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

// Helper: Generate Long-Lived Refresh Token (7 days)
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

// 1. REGISTER USER & SEND INITIAL OTP
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "Please fill in all required fields." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    // Generate 6-digit OTP valid for 10 minutes
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      otp,
      otpExpiresAt,
      isEmailVerified: false
    });

    // Send Welcome & OTP Email
    await sendEmail({
      to: newUser.email,
      subject: "Welcome to The Real Sam Bank - Verify Your Email",
      html: `
        <h3>Welcome, ${newUser.firstName}!</h3>
        <p>Thank you for signing up. Please use the OTP below to verify your email address:</p>
        <h2>${otp}</h2>
        <p>This code expires in 10 minutes.</p>
      `
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email for verification OTP.",
      userId: newUser._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Registration failed" });
  }
};

// 2. VERIFY OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.otp !== otp || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP code." });
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Email verified successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. RESEND OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail({
      to: email,
      subject: "Your New Verification OTP - Sam Bank",
      html: `<h3>Email Verification</h3><p>Your new OTP code is: <b>${otp}</b></p><p>Expires in 10 minutes.</p>`
    });

    res.status(200).json({ success: true, message: "A new OTP has been sent to your email." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. LOGIN & ISSUE TOKENS
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ error: "Please verify your email address before logging in." });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Persist refresh token in MongoDB
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Login failed" });
  }
};

// 5. REFRESH ACCESS TOKEN
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token is required." });
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({ error: "Invalid or revoked refresh token." });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err || user._id.toString() !== decoded.id) {
        return res.status(403).json({ error: "Invalid refresh token." });
      }

      const newAccessToken = generateAccessToken(user._id);
      res.status(200).json({ success: true, accessToken: newAccessToken });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. LOGOUT & INVALIDATE REFRESH TOKEN
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.status(200).json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};