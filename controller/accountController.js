const User = require('../model/userModel');

exports.createNewAccount = async (req, res) => {
  try {
    const { accountNumber, bankName } = req.body;
    const userId = req.user.id;

    if (!accountNumber) {
      return res.status(400).json({ message: "Account number is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { accountNumber, bankName: bankName || 'Sam Bank', balance: 0.00, accountStatus: 'active' },
      { new: true }
    ).select('-password -transactionPin -otp');

    res.status(201).json({ message: "Account created successfully", account: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error creating account", error: error.message });
  }
};

exports.getAccountBalance = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const user = await User.findOne({ accountNumber }).select('accountNumber bankName balance accountStatus first_name last_name');

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json({
      message: "Balance retrieved successfully",
      data: {
        accountNumber: user.accountNumber,
        bankName: user.bankName,
        balance: user.balance,
        status: user.accountStatus,
        accountName: `${user.first_name} ${user.last_name}`
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching balance", error: error.message });
  }
};

exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await User.find({ accountNumber: { $exists: true, $ne: null } })
      .select('first_name middle_name last_name email phone accountNumber bankName balance accountStatus createdAt');

    res.status(200).json({ message: "Accounts retrieved successfully", count: accounts.length, accounts });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving accounts", error: error.message });
  }
};

exports.getAccountByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;

    const user = await User.findOne({
      $or: [
        { accountNumber: identifier },
        { phone: identifier },
        { email: identifier }
      ]
    }).select('first_name middle_name last_name email phone accountNumber bankName balance accountStatus createdAt');

    if (!user) {
      return res.status(404).json({ message: "Account not found with provided identifier" });
    }

    res.status(200).json({ message: "Account details retrieved successfully", account: user });
  } catch (error) {
    res.status(500).json({ message: "Error searching account", error: error.message });
  }
};

exports.updateAccountDetails = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { first_name, middle_name, last_name, phone } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { accountNumber },
      { $set: { first_name, middle_name, last_name, phone } },
      { new: true, runValidators: true }
    ).select('first_name middle_name last_name email phone accountNumber bankName accountStatus');

    if (!updatedUser) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json({ message: "Account updated successfully", account: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating account", error: error.message });
  }
};

exports.setAccountStatus = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { status } = req.body;

    if (!['active', 'dormant', 'suspended', 'closed'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value. Allowed: active, dormant, suspended, closed" });
    }

    const user = await User.findOneAndUpdate(
      { accountNumber },
      { $set: { accountStatus: status } },
      { new: true }
    ).select('accountNumber first_name last_name accountStatus');

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json({ message: `Account status updated to ${status}`, account: user });
  } catch (error) {
    res.status(500).json({ message: "Error updating account status", error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;

    const deletedUser = await User.findOneAndDelete({ accountNumber });

    if (!deletedUser) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting account", error: error.message });
  }
};