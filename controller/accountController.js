// const Account = require("../model/accountModel");
// const User = require("../model/userModel");
// const nibssGateway = require("../Gateway/nibssGateway");

// exports.createAccount = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const user = await User.findById(userId);

    
//     if (!user.isIdentityVerified) {
//       return res.status(400).json({ error: "Identity must be verified (BVN/NIN) before creating an account" });
//     }

  
//     const existingAccount = await Account.findOne({ userId });
//     if (existingAccount) {
//       return res.status(400).json({ error: "Account already exists for this user" });
//     }

//     const { dob } = req.body; 
//     const nibssAcc = await nibssGateway.createAccount(user.kycType, user.kycNumber, dob);

//     const newAccount = await Account.create({
//       userId,
//       accountNumber: nibssAcc.accountNumber || `99${Math.floor(10000000 + Math.random() * 90000000)}`,
//       balance: 15000.00
//     });

//     res.status(201).json({ message: "Account created successfully", account: newAccount });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

const Account = require("../model/accountModel");
const User = require("../model/userModel");
const nibssGateway = require("../Gateway/nibssGateway");
const sendEmail = require("../middleware/sendEmail");

exports.createAccount = async (req, res) => {
  try {
    const { kycType, kycID, dob } = req.body;

    if (!kycType || !kycID || !dob) {
      return res.status(400).json({ error: "kycType, kycID, and dob are required." });
    }

    // 1. Call Nibss Gateway to generate account
    const nibssResponse = await nibssGateway.createAccount({ kycType, kycID, dob });

    const accountNumber = nibssResponse?.accountNumber || nibssResponse?.data?.accountNumber;
    const accountName = nibssResponse?.accountName || nibssResponse?.data?.accountName;

    if (!accountNumber) {
      return res.status(400).json({ error: "Failed to generate account number via Nibss." });
    }

    // 2. Save account in local DB linked to the logged-in user
    const newAccount = await Account.create({
      user: req.user.id,
      accountNumber,
      accountName: accountName || "Sam Bank Customer",
      balance: 15000 
    });

    // 3. Send Account Creation Email
    const user = await User.findById(req.user.id);
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "Welcome to The Real Sam Bank - Account Created",
        html: `
          <h3>Congratulations ${user.firstName || ""}!</h3>
          <p>Your bank account has been successfully generated.</p>
          <ul>
            <li><b>Account Name:</b> ${newAccount.accountName}</li>
            <li><b>Account Number:</b> ${newAccount.accountNumber}</li>
            <li><b>Opening Balance:</b> ₦${newAccount.balance.toLocaleString()}</li>
          </ul>
        `
      });
    }

    res.status(201).json({
      message: "Account created successfully",
      account: newAccount
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Account creation failed" });
  }
};