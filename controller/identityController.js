const nibssService = require('../Services/nibssServices');

// Register a customer's BVN in NIBSS central identity store
exports.createBvn = async (req, res) => {
  try {
    const { bvn, firstName, lastName, dob, phone } = req.body;

    if (!bvn || !firstName || !lastName || !dob || !phone) {
      return res.status(400).json({ message: "All BVN fields (bvn, firstName, lastName, dob, phone) are required" });
    }

    const response = await nibssService.post('/insertBvn', { bvn, firstName, lastName, dob, phone });
    res.status(201).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "BVN registration failed", error: message });
  }
};

// Register a customer's NIN in NIBSS central identity store
exports.createNin = async (req, res) => {
  try {
    const { nin, firstName, lastName, dob } = req.body;

    if (!nin || !firstName || !lastName || !dob) {
      return res.status(400).json({ message: "All NIN fields (nin, firstName, lastName, dob) are required" });
    }

    const response = await nibssService.post('/insertNin', { nin, firstName, lastName, dob });
    res.status(201).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "NIN registration failed", error: message });
  }
};

// Validate BVN record
exports.validateBvn = async (req, res) => {
  try {
    const { bvn } = req.body;

    if (!bvn) {
      return res.status(400).json({ message: "BVN is required for validation" });
    }

    const response = await nibssService.post('/validateBvn', { bvn });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "BVN validation failed", error: message });
  }
};

// Validate NIN record
exports.validateNin = async (req, res) => {
  try {
    const { nin } = req.body;

    if (!nin) {
      return res.status(400).json({ message: "NIN is required for validation" });
    }

    const response = await nibssService.post('/validateNin', { nin });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "NIN validation failed", error: message });
  }
};