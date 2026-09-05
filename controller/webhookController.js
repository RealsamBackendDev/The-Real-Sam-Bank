const Transaction = require('../model/transactionModel');
const Account = require('../model/accountModel');

exports.handleNibssWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    // Validate event type
    if (event === 'transfer.success' || event === 'credit.alert') {
      const { transactionId, accountNumber, amount } = data;

      // Find local target account
      const account = await Account.findOne({ account_number: accountNumber });
      if (account) {
        // Credit local balance
        account.balance += Number(amount);
        await account.save();

       
        await Transaction.create({
          user: account.user,
          account_number: accountNumber,
          transaction_id: transactionId,
          transaction_type: 'DEPOSIT',
          amount: Number(amount),
          to_account: accountNumber,
          status: 'SUCCESS'
        });
      }
    }

    res.status(200).json({ status: 'success', message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook Error:', error.message);
    res.status(500).json({ status: 'error', message: 'Internal webhook processing error' });
  }
};