const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  reference: { 
    type: String, 
    required: true, 
    unique: true 
},
  senderAccountId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Account", 
    required: true 
},
  receiverAccountId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Account" 
},
  recipientAccountNumber: { 
    type: String,
    required: true 
},
  recipientBankCode: { 
    type: String, 
    required: true 
},
  amount: { 
    type: Number, 
    required: true 
},
  type: { 
    type: String, 
    enum: ["INTRA_BANK", "INTER_BANK"], 
    required: true 
},
  status: { 
    type: String, 
    enum: ["PENDING", "SUCCESS", "FAILED"], 
    default: "SUCCESS" 
},
  narration: { type: String }
}, 

{ timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);