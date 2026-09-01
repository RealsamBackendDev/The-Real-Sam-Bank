const Account = require("../model/accountModel");
const Transaction = require("../model/transactionmode"); // matches your model filename
const nibssGateway = require("../Gateway/nibssGateway");
const crypto = require("crypto");


exports.nameEnquiry = async (req, res) => {
  try {
    const { accountNumber } = req.body;
    const details = await nibssGateway.nameEnquiry(accountNumber);
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    res.status(400).json({ error: error.message || "Account enquiry failed" });
  }
};


exports.transfer = async (req, res) => {
  try {
    const { recipientAccountNumber, recipientBankCode, amount, narration } = req.body;
    const userId = req.user.id;

    if (amount <= 0) {
      return res.status(400).json({ error: "Transfer amount must be greater than 0" });
    }

   
    const senderAccount = await Account.findOne({ userId });
    if (!senderAccount) {
      return res.status(404).json({ error: "Sender account not found" });
    }


    if (senderAccount.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    const reference = `TRX-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    
    const nibssResult = await nibssGateway.transferFunds(
      senderAccount.accountNumber,
      recipientAccountNumber,
      amount
    );


    senderAccount.balance -= Number(amount);
    await senderAccount.save();

    
    const transaction = await Transaction.create({
      reference,
      senderAccountId: senderAccount._id,
      recipientAccountNumber,
      recipientBankCode: recipientBankCode || "999001",
      amount,
      type: "INTER_BANK",
      status: "SUCCESS",
      narration: narration || "Transfer"
    });

    res.status(200).json({
      message: "Transfer successful",
      transaction,
      newBalance: senderAccount.balance
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Transfer processing failed" });
  }
};

exports.getTransactionHistory = async (req, res) => {
  try {
    const userAccount = await Account.findOne({ userId: req.user.id });
    if (!userAccount) {
      return res.status(404).json({ error: "Account not found" });
    }

    const transactions = await Transaction.find({
      $or: [
        { senderAccountId: userAccount._id },
        { recipientAccountNumber: userAccount.accountNumber }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({ count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};