const User = require('../model/userModel');
const nibssService = require('../Services/nibssServices');

exports.createBvn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bvn, firstName, lastName, dob, phone } = req.body;

    if (!bvn || !firstName || !lastName || !dob || !phone) {
      return res.status(400).json({ message: "All BVN fields (bvn, firstName, lastName, dob, phone) are required" });
    }

    if (!/^\d{11}$/.test(bvn)) {
      return res.status(400).json({ message: "BVN must be exactly 11 digits" });
    }

    const user = await User.findById(userId);
    if (user.bvn) {
      return res.status(409).json({ message: "You have already registered a BVN" });
    }

    const response = await nibssService.post('/insertBvn', { bvn, firstName, lastName, dob, phone });

    user.bvn = bvn;
    user.dob = dob;
    await user.save();

    res.status(201).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "BVN registration failed", error: message });
  }
};

exports.createNin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nin, firstName, lastName, dob } = req.body;

    if (!nin || !firstName || !lastName || !dob) {
      return res.status(400).json({ message: "All NIN fields (nin, firstName, lastName, dob) are required" });
    }

    if (!/^\d{11}$/.test(nin)) {
      return res.status(400).json({ message: "NIN must be exactly 11 digits" });
    }

    const user = await User.findById(userId);
    if (user.nin) {
      return res.status(409).json({ message: "You have already registered a NIN" });
    }

    const response = await nibssService.post('/insertNin', { nin, firstName, lastName, dob });

    user.nin = nin;
    user.dob = dob;
    await user.save();

    res.status(201).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "NIN registration failed", error: message });
  }
};

exports.validateBvn = async (req, res) => {
  try {
    const { bvn } = req.body;

    if (!bvn) {
      return res.status(400).json({ message: "BVN is required for validation" });
    }

    if (!/^\d{11}$/.test(bvn)) {
      return res.status(400).json({ message: "BVN must be exactly 11 digits" });
    }

    const response = await nibssService.post('/validateBvn', { bvn });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "BVN validation failed", error: message });
  }
};

exports.validateNin = async (req, res) => {
  try {
    const { nin } = req.body;

    if (!nin) {
      return res.status(400).json({ message: "NIN is required for validation" });
    }

    if (!/^\d{11}$/.test(nin)) {
      return res.status(400).json({ message: "NIN must be exactly 11 digits" });
    }

    const response = await nibssService.post('/validateNin', { nin });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "NIN validation failed", error: message });
  }
};
