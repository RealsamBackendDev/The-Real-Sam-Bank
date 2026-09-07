const User = require('../model/userModel');
const Account = require('../model/accountModel');
const Transaction = require('../model/transactionModel');
const nibssService = require('../Services/nibssServices');
const { triggerWebhook } = require('../utils/webhook');
const bcrypt = require('bcrypt');

exports.nameEnquiry = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({ message: "Account number must be exactly 10 digits" });
    }
    const response = await nibssService.get(`/account/name-enquiry/${accountNumber}`);
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "Name enquiry failed", error: message });
  }
};

exports.transferFunds = async (req, res) => {
  try {
    const { from, to, amount, pin, idempotencyKey } = req.body;
    if (!from || !to || !amount || !pin) {
      return res.status(400).json({ message: "from, to, amount, and pin are required" });
    }
    if (!idempotencyKey) {
      return res.status(400).json({ message: "idempotencyKey is required to prevent duplicate transfers" });
    }
    if (!/^\d{10}$/.test(from) || !/^\d{10}$/.test(to)) {
      return res.status(400).json({ message: "Account numbers must be exactly 10 digits" });
    }
    if (from === to) {
      return res.status(400).json({ message: "Cannot transfer to the same account" });
    }
    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const existing = await Transaction.findOne({ idempotencyKey });
    if (existing) {
      if (existing.status === 'SUCCESS') {
        return res.status(409).json({ message: "Duplicate transfer detected", transactionId: existing.transactionId, status: existing.status });
      }
      if (existing.status === 'PENDING') {
        return res.status(200).json({ message: "Transfer is still being processed", transactionId: existing.transactionId, status: existing.status });
      }
    }

    const senderAccount = await Account.findOne({ accountNumber: from, user: req.user.id });
    if (!senderAccount) {
      return res.status(403).json({ message: "Unauthorized: you do not own the source account" });
    }

    const sender = await User.findById(req.user.id);
    if (!sender || !sender.transactionPin) {
      return res.status(400).json({ message: "Transaction PIN not set" });
    }
    const pinMatch = await bcrypt.compare(pin, sender.transactionPin);
    if (!pinMatch) {
      return res.status(401).json({ message: "Invalid transaction PIN" });
    }

    const nibssBalance = await nibssService.get(`/account/balance/${from}`);
    if (nibssBalance.data.balance < transferAmount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    const nameCheck = await nibssService.get(`/account/name-enquiry/${to}`);

    const localTx = await Transaction.create({
      user: req.user.id,
      accountNumber: from,
      transactionId: `PENDING-${Date.now()}`,
      idempotencyKey,
      transactionType: 'TRANSFER',
      amount: transferAmount,
      toAccount: to,
      recipientName: nameCheck.data?.accountName || null,
      status: 'PENDING'
    });

    let response;
    try {
      response = await nibssService.post('/transfer', { from, to, amount: String(transferAmount) });
    } catch (networkError) {
      return res.status(202).json({
        message: "Transfer submitted but status is pending due to network delay. Check status shortly.",
        transactionId: localTx.transactionId,
        status: 'PENDING'
      });
    }

    const { transactionId, status } = response.data;
    localTx.transactionId = transactionId;
    localTx.status = status || 'PENDING';
    await localTx.save();

    const receiverAccount = await Account.findOne({ accountNumber: to });
    if (receiverAccount) {
      await triggerWebhook('credit.alert', {
        transactionId, accountNumber: to, amount: transferAmount,
        fromAccount: from, senderName: `${sender.first_name} ${sender.last_name}`
      });
    }

    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "Transfer failed", error: message });
  }
};

exports.reverseTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;
    const transaction = await Transaction.findOne({ transactionId, user: userId });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (transaction.status === 'REVERSED') {
      return res.status(409).json({ message: "Transaction already reversed" });
    }
    if (transaction.status === 'SUCCESS') {
      const nibssStatus = await nibssService.get(`/transaction/${transactionId}`);
      if (nibssStatus.data.status === 'SUCCESS') {
        return res.status(400).json({ message: "Cannot reverse a completed NIBSS transaction. Contact support." });
      }
    }
    transaction.status = 'REVERSED';
    await transaction.save();

    await Transaction.create({
      user: userId,
      accountNumber: transaction.accountNumber,
      transactionId: `REV-${transactionId}`,
      transactionType: 'REVERSAL',
      amount: transaction.amount,
      toAccount: transaction.toAccount,
      fromAccount: transaction.accountNumber,
      status: 'SUCCESS',
      meta: { originalTransactionId: transactionId }
    });

    res.status(200).json({ message: "Transaction reversed successfully", originalTransaction: transactionId, reversalId: `REV-${transactionId}` });
  } catch (error) {
    res.status(500).json({ message: "Error reversing transaction", error: error.message });
  }
};

exports.getTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    if (!transactionId) return res.status(400).json({ message: "Transaction ID is required" });
    const localTx = await Transaction.findOne({ transactionId, user: req.user.id });
    if (!localTx) return res.status(404).json({ message: "Transaction not found" });

    if (localTx.status === 'PENDING' && !transactionId.startsWith('PENDING-')) {
      try {
        const nibssStatus = await nibssService.get(`/transaction/${transactionId}`);
        if (nibssStatus.data.status !== localTx.status) {
          localTx.status = nibssStatus.data.status;
          await localTx.save();
        }
        return res.status(200).json(nibssStatus.data);
      } catch (error) {
        return res.status(200).json({ transactionId: localTx.transactionId, status: localTx.status, amount: localTx.amount, from: localTx.accountNumber, to: localTx.toAccount, timestamp: localTx.createdAt });
      }
    }

    res.status(200).json({ transactionId: localTx.transactionId, status: localTx.status, amount: localTx.amount, from: localTx.accountNumber, to: localTx.toAccount, timestamp: localTx.createdAt });
  } catch (error) {
    res.status(500).json({ message: "Transaction status check failed", error: error.message });
  }
};

exports.getUserTransactionHistory = async (req, res) => {
  try {
    const { type, fromDate, toDate, limit = 20, page = 1 } = req.query;
    const query = { user: req.user.id };
    if (type) query.transactionType = type.toUpperCase();
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Transaction.countDocuments(query)
    ]);
    res.status(200).json({ message: "Transaction history retrieved successfully", total, page: Number(page), limit: Number(limit), count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ message: "Error fetching transaction history", error: error.message });
  }
};

exports.buyAirtime = async (req, res) => {
  try {
    const { phone, network, amount, accountNumber, pin, idempotencyKey } = req.body;
    if (!phone || !network || !amount || !accountNumber || !pin) {
      return res.status(400).json({ message: "Phone, network, amount, accountNumber, and pin are required" });
    }
    if (!idempotencyKey) {
      return res.status(400).json({ message: "idempotencyKey is required to prevent duplicate purchases" });
    }
    const duplicate = await Transaction.findOne({ idempotencyKey });
    if (duplicate) {
      return res.status(409).json({ message: "Duplicate purchase detected", transactionId: duplicate.transactionId, status: duplicate.status });
    }
    const purchaseAmount = Number(amount);
    if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }
    const account = await Account.findOne({ accountNumber, user: req.user.id });
    if (!account) return res.status(403).json({ message: "Unauthorized: you do not own this account" });
    const user = await User.findById(req.user.id);
    if (!user || !user.transactionPin) return res.status(400).json({ message: "Transaction PIN not set" });
    const pinMatch = await bcrypt.compare(pin, user.transactionPin);
    if (!pinMatch) return res.status(401).json({ message: "Invalid transaction PIN" });
    const nibssBalance = await nibssService.get(`/account/balance/${accountNumber}`);
    if (nibssBalance.data.balance < purchaseAmount) return res.status(400).json({ message: "Insufficient funds" });

    const transactionId = `AIR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const transaction = await Transaction.create({
      user: req.user.id, accountNumber, transactionId, idempotencyKey,
      transactionType: 'AIRTIME', amount: purchaseAmount,
      toAccount: `${network.toUpperCase()}-${phone}`, status: 'PENDING'
    });
    await triggerWebhook('purchase.success', {
      transactionId, accountNumber, amount: purchaseAmount, type: 'AIRTIME',
      details: { phone, network: network.toUpperCase() }
    });
    res.status(200).json({ message: "Airtime purchase initiated", transaction });
  } catch (error) {
    res.status(500).json({ message: "Error purchasing airtime", error: error.message });
  }
};

exports.buyData = async (req, res) => {
  try {
    const { phone, network, plan, amount, accountNumber, pin, idempotencyKey } = req.body;
    if (!phone || !network || !plan || !amount || !accountNumber || !pin) {
      return res.status(400).json({ message: "Phone, network, plan, amount, accountNumber, and pin are required" });
    }
    if (!idempotencyKey) {
      return res.status(400).json({ message: "idempotencyKey is required to prevent duplicate purchases" });
    }
    const duplicate = await Transaction.findOne({ idempotencyKey });
    if (duplicate) {
      return res.status(409).json({ message: "Duplicate purchase detected", transactionId: duplicate.transactionId, status: duplicate.status });
    }
    const purchaseAmount = Number(amount);
    if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }
    const account = await Account.findOne({ accountNumber, user: req.user.id });
    if (!account) return res.status(403).json({ message: "Unauthorized: you do not own this account" });
    const user = await User.findById(req.user.id);
    if (!user || !user.transactionPin) return res.status(400).json({ message: "Transaction PIN not set" });
    const pinMatch = await bcrypt.compare(pin, user.transactionPin);
    if (!pinMatch) return res.status(401).json({ message: "Invalid transaction PIN" });
    const nibssBalance = await nibssService.get(`/account/balance/${accountNumber}`);
    if (nibssBalance.data.balance < purchaseAmount) return res.status(400).json({ message: "Insufficient funds" });

    const transactionId = `DAT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const transaction = await Transaction.create({
      user: req.user.id, accountNumber, transactionId, idempotencyKey,
      transactionType: 'DATA', amount: purchaseAmount,
      toAccount: `${network.toUpperCase()}-${phone} (${plan})`, status: 'PENDING'
    });
    await triggerWebhook('purchase.success', {
      transactionId, accountNumber, amount: purchaseAmount, type: 'DATA',
      details: { phone, network: network.toUpperCase(), plan }
    });
    res.status(200).json({ message: "Data bundle purchase initiated", transaction });
  } catch (error) {
    res.status(500).json({ message: "Error purchasing data", error: error.message });
  }
};
