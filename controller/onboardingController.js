const User = require("../model/userModel");
const nibssGateway = require("../Gateway/nibssGateway");

exports.verifyIdentity = async (req, res) => {
  try {
    const { kycType, kycID } = req.body; 
    const userId = req.user.id;

    let nibssResponse;
    if (kycType === "BVN") {
      nibssResponse = await nibssGateway.validateBvn(kycID);
    } else if (kycType === "NIN") {
      nibssResponse = await nibssGateway.validateNin(kycID);
    } else {
      return res.status(400).json({ error: "Invalid KYC type. Must be BVN or NIN." });
    }

   
    const user = await User.findByIdAndUpdate(
      userId,
      { isIdentityVerified: true, kycType, kycNumber: kycID },
      { new: true }
    );

    res.status(200).json({
      message: "Identity verified successfully",
      isIdentityVerified: user.isIdentityVerified,
      data: nibssResponse
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "Identity verification failed" });
  }
};