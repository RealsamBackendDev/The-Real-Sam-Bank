const Transaction = require('../model/transactionModel');
const Account = require('../model/accountModel');
const nibssService = require('../Services/nibssServices');

// Name Enquiry
exports.nameEnquiry = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const response = await nibssService.get(`/account/name-enquiry/${accountNumber}`);
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "Name enquiry failed", error: message });
  }
};

// Transfer Funds
exports.transferFunds = async (req, res) => {
  try {
    const { from, to, amount } = req.body;
    if (!from || !to || !amount) {
      return res.status(400).json({ message: "from, to, and amount are required" });
    }

    // Ensure sender owns the source account
    const senderAccount = await Account.findOne({ account_number: from, user: req.user.id });
    if (!senderAccount) {
      return res.status(403).json({ message: "Unauthorized transaction source account" });
    }

    if (senderAccount.balance < Number(amount)) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    // Process transfer via NIBSS API
    const response = await nibssService.post('/transfer', { from, to, amount: String(amount) });
    const { transactionId, status } = response.data;

    // Deduct sender balance locally
    senderAccount.balance -= Number(amount);
    await senderAccount.save();

    // Credit receiver locally if it's an intra-bank transfer
    const receiverAccount = await Account.findOne({ account_number: to });
    if (receiverAccount) {
      receiverAccount.balance += Number(amount);
      await receiverAccount.save();
    }

    // Save transaction log for privacy isolation
    const newTransaction = new Transaction({
      user: req.user.id,
      account_number: from,
      transaction_id: transactionId,
      transaction_type: 'TRANSFER',
      amount: Number(amount),
      to_account: to,
      status: status || 'SUCCESS'
    });

    await newTransaction.save();
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "Transfer failed", error: message });
  }
};

// Transaction Status Query (TSQ)
exports.getTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const response = await nibssService.get(`/transaction/${transactionId}`);
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "Transaction status check failed", error: message });
  }
};

// Get personal transaction history (Data Isolation)
exports.getUserTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching transaction history", error: error.message });
  }
};

// Buy Airtime
exports.buyAirtime = async (req, res) => {
  try {
    const { phone, network, amount, account_number } = req.body;

    if (!phone || !network || !amount || !account_number) {
      return res.status(400).json({ message: "Phone, network, amount, and account number are required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero" });
    }

    const account = await Account.findOne({ account_number, user: req.user.id });
    if (!account) {
      return res.status(404).json({ message: "Account not found or unauthorized" });
    }

    if (account.balance < amount) {
      return res.status(400).json({ message: "Insufficient account balance" });
    }

    // Deduct balance
    account.balance -= Number(amount);
    await account.save();

    // Generate reference and record transaction
    const transactionId = `AIR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const transaction = await Transaction.create({
      user: req.user.id,
      account_number,
      transaction_id: transactionId,
      transaction_type: 'TRANSFER',
      amount: Number(amount),
      to_account: `${network.toUpperCase()}-${phone}`,
      status: 'SUCCESS'
    });

    // Send transaction email alert
    await emailService.sendTransactionAlert(req.user.email, {
      type: `Airtime Purchase (${network.toUpperCase()} - ${phone})`,
      amount,
      account: account_number,
      transactionId
    });

    res.status(200).json({
      message: "Airtime purchase successful",
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: "Error purchasing airtime", error: error.message });
  }
};

// Buy Data
exports.buyData = async (req, res) => {
  try {
    const { phone, network, plan, amount, account_number } = req.body;

    if (!phone || !network || !plan || !amount || !account_number) {
      return res.status(400).json({ message: "Phone, network, plan, amount, and account number are required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero" });
    }

    const account = await Account.findOne({ account_number, user: req.user.id });
    if (!account) {
      return res.status(404).json({ message: "Account not found or unauthorized" });
    }

    if (account.balance < amount) {
      return res.status(400).json({ message: "Insufficient account balance" });
    }

    // Deduct balance
    account.balance -= Number(amount);
    await account.save();

    // Generate reference and record transaction
    const transactionId = `DAT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const transaction = await Transaction.create({
      user: req.user.id,
      account_number,
      transaction_id: transactionId,
      transaction_type: 'TRANSFER',
      amount: Number(amount),
      to_account: `${network.toUpperCase()}-${phone} (${plan})`,
      status: 'SUCCESS'
    });

    // Send transaction email alert
    await emailService.sendTransactionAlert(req.user.email, {
      type: `Data Bundle Purchase (${plan} - ${phone})`,
      amount,
      account: account_number,
      transactionId
    });

    res.status(200).json({
      message: "Data purchase successful",
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: "Error purchasing data", error: error.message });
  }
};