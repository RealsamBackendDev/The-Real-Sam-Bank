const User = require('../model/userModel');
const Account = require('../model/accountModel');
const nibssService = require('../Services/nibssServices');

const verifyOwnership = (req, accountOwnerId) => {
  if (req.user.id !== accountOwnerId.toString() && req.user.role !== 'admin') {
    return false;
  }
  return true;
};

exports.createNewAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const existingAccount = await Account.findOne({ user: userId });
    if (existingAccount) {
      return res.status(409).json({ message: "Customer already has an account. Maximum one account allowed." });
    }

    const user = await User.findById(userId);
    if (!user.bvn && !user.nin) {
      return res.status(400).json({ message: "BVN or NIN required before account creation. Complete identity verification first." });
    }

    const kycType = user.bvn ? 'bvn' : 'nin';
    const kycID = user.bvn || user.nin;

    if (!user.dob) {
      return res.status(400).json({ message: "Date of birth not found. Complete identity verification first." });
    }

    const response = await nibssService.post('/account/create', {
      kycType,
      kycID,
      dob: user.dob
    });

    const { accountNumber, bankCode, bankName, balance } = response.data;

    const newAccount = await Account.create({
      user: userId,
      accountNumber,
      bankCode,
      bankName,
      kycType,
      kycID,
      dob: user.dob,
      balance
    });

    res.status(201).json({
      message: "Account created successfully",
      account: {
        accountNumber: newAccount.accountNumber,
        bankName: newAccount.bankName,
        bankCode: newAccount.bankCode,
        balance: newAccount.balance,
        accountStatus: newAccount.accountStatus
      }
    });
  } catch (error) {
    if (error.response?.data?.message?.includes('already linked')) {
      return res.status(409).json({ message: error.response.data.message });
    }
    res.status(500).json({ message: "Error creating account", error: error.message });
  }
};

exports.getAccountBalance = async (req, res) => {
  try {
    const { accountNumber } = req.params;

    const account = await Account.findOne({ accountNumber }).populate('user', 'first_name last_name');
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (!verifyOwnership(req, account.user._id)) {
      return res.status(403).json({ message: "Access denied. You can only view your own account balance." });
    }

    const nibssBalance = await nibssService.get(`/account/balance/${accountNumber}`);

    if (account.balance !== nibssBalance.data.balance) {
      account.balance = nibssBalance.data.balance;
      await account.save();
    }

    res.status(200).json({
      message: "Balance retrieved successfully",
      data: {
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        bankCode: account.bankCode,
        balance: nibssBalance.data.balance,
        status: account.accountStatus,
        accountName: `${account.user.first_name} ${account.user.last_name}`
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching balance", error: error.message });
  }
};

exports.getAllAccounts = async (req, res) => {
  try {
    let query = { accountNumber: { $exists: true, $ne: null } };

    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    const accounts = await Account.find(query)
      .populate('user', 'first_name middle_name last_name email phone createdAt')
      .lean();

    const formatted = accounts.map(acc => ({
      accountNumber: acc.accountNumber,
      bankName: acc.bankName,
      bankCode: acc.bankCode,
      balance: acc.balance,
      accountStatus: acc.accountStatus,
      kycType: acc.kycType,
      createdAt: acc.createdAt,
      customer: acc.user
    }));

    res.status(200).json({
      message: "Accounts retrieved successfully",
      count: accounts.length,
      accounts: formatted
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving accounts", error: error.message });
  }
};

exports.getAccountByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;

    const user = await User.findOne({
      $or: [{ phone: identifier }, { email: identifier }]
    });

    const account = await Account.findOne({
      $or: [{ accountNumber: identifier }, { user: user?._id }]
    }).populate('user', '-password -otp -otpExpires -transactionPin');

    if (!account) {
      return res.status(404).json({ message: "Account not found with provided identifier" });
    }

    if (!verifyOwnership(req, account.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({
      message: "Account details retrieved successfully",
      account: {
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        bankCode: account.bankCode,
        balance: account.balance,
        accountStatus: account.accountStatus,
        kycType: account.kycType,
        createdAt: account.createdAt,
        customer: account.user
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error searching account", error: error.message });
  }
};

exports.updateAccountDetails = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { first_name, middle_name, last_name, phone } = req.body;

    const account = await Account.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (!verifyOwnership(req, account.user)) {
      return res.status(403).json({ message: "Access denied. You can only update your own account." });
    }

    await User.findByIdAndUpdate(
      account.user,
      { $set: { first_name, middle_name, last_name, phone } },
      { new: true, runValidators: true }
    );

    const updatedAccount = await Account.findOne({ accountNumber })
      .populate('user', 'first_name middle_name last_name email phone accountNumber bankName bankCode accountStatus');

    res.status(200).json({ message: "Account updated successfully", account: updatedAccount });
  } catch (error) {
    res.status(500).json({ message: "Error updating account", error: error.message });
  }
};

exports.setAccountStatus = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { status } = req.body;

    const account = await Account.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (req.user.role !== 'admin' && req.user.id !== account.user.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!['active', 'dormant', 'suspended', 'closed'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value. Allowed: active, dormant, suspended, closed" });
    }

    account.accountStatus = status;
    await account.save();

    res.status(200).json({
      message: `Account status updated to ${status}`,
      account: {
        accountNumber: account.accountNumber,
        accountStatus: account.accountStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating account status", error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;

    const account = await Account.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Contact admin to delete your account." });
    }

    await Account.findOneAndDelete({ accountNumber });

    res.status(200).json({ message: "Account record removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting account", error: error.message });
  }
};

