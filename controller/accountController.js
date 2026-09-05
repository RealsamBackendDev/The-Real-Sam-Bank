const Account = require('../Model/accountModel');
const nibssService = require('../Services/nibssServices');


exports.createNewAccount = async (req, res) => {
  try {
    const { kycType, kycID, dob } = req.body;
    const userId = req.user.id;

    if (!kycType || !kycID || !dob) {
      return res.status(400).json({ message: "kycType, kycID, and dob are required" });
    }

  
    const existingAccount = await Account.findOne({ user: userId });
    if (existingAccount) {
      return res.status(400).json({ message: "Customer already has an existing account" });
    }

    const nibssResponse = await nibssService.post('/account/create', { kycType, kycID, dob });
    const { accountNumber, bankCode, bankName, balance } = nibssResponse.data;

    const newAccount = new Account({
      user: userId,
      account_number: accountNumber,
      bankCode,
      bankName,
      kycType,
      kycID,
      balance: balance || 15000
    });

    await newAccount.save();
    res.status(201).json({ message: "Account created successfully", account: newAccount });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "Error creating account", error: message });
  }
};

// Get account balance
exports.getAccountBalance = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const account = await Account.findOne({ account_number: accountNumber, user: req.user.id });
    if (!account) return res.status(404).json({ message: "Account not found or access denied" });

    res.status(200).json({ accountNumber: account.account_number, balance: account.balance });
  } catch (error) {
    res.status(500).json({ message: "Error fetching balance", error: error.message });
  }
};