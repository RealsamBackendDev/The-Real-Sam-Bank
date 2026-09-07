const jwt = require('jsonwebtoken');
const User = require('../model/userModel');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -otp -otpExpires -transactionPin');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role || 'customer',
      accountNumber: user.accountNumber || null
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
  }
};

exports.optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password -otp -otpExpires -transactionPin');
      if (user) {
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role || 'customer',
          accountNumber: user.accountNumber || null
        };
      }
    }

    next();
  } catch (error) {
    next();
  }
};
