const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    unique: true 
  },

  accountNumber: { 
    type: String, 
    required: true, 
    unique: true
 },
  balance: { 
    type: Number, 
    default: 15000.00
 }, 
  bankCode: { 
    type: String, 
    default: "999001" 
}
}, 

{ timestamps: true });

module.exports = mongoose.model("Account", accountSchema);