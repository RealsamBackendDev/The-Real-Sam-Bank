const nibssService = require('../Services/nibssServices');
const nibssConfig = require('../config/nibssConfig');

exports.onboardFintech = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Fintech name and email are required" });
    }

    const response = await nibssService.post('/fintech/onboard', { name, email });
    const { apiKey, apiSecret, bankCode, bankName } = response.data;

    nibssConfig.apiKey = apiKey;
    nibssConfig.apiSecret = apiSecret;
    nibssConfig.bankCode = bankCode;
    nibssConfig.bankName = bankName;

    res.status(201).json({
      message: "Fintech onboarded successfully. Save these credentials securely.",
      data: { bankCode, bankName, apiKey, apiSecret }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "Fintech onboarding failed", error: message });
  }
};

exports.getFintechToken = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { apiKey, apiSecret } = req.body;
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ message: "apiKey and apiSecret are required" });
    }

    const response = await nibssService.post('/auth/token', { apiKey, apiSecret });
    const { token, fintech } = response.data;

    nibssConfig.token = token;
    nibssConfig.tokenExpiresAt = Date.now() + 3600000;

    res.status(200).json({
      message: "Authentication successful",
      token,
      fintech
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "Fintech authentication failed", error: message });
  }
};
