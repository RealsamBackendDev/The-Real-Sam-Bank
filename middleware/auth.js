const jwt = require("jsonwebtoken");
const User = require("../model/userModel");


exports.protect = async (req, res, next) => {
  try {
    let token;

   
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

   
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

   
    req.user = decoded; 

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};