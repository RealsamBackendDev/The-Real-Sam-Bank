const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
  firstName: { 
    type: String,
     required: true 
    },
  lastName: { 
    type: String, 
    required: true 
},
  email: {
    type: String,
     required: true,
      unique: true
     },
  password: { 
    type: String,
     required: true
     },
  isIdentityVerified: { 
    type: Boolean, default: false 
},
  kycType: { 
    type: String, 
    enum: ["BVN", "NIN", null],
    default: null 
    },
  kycNumber: {
     type: String, 
     default: null },
     
refreshToken: {
  type: String,
  default: null
}

},
 { timestamps: true });

module.exports = mongoose.model("User", userSchema);