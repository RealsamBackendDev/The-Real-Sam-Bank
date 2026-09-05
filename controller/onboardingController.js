const nibssService = require('../Services/nibssServices');

exports.onboardFintech = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Fintech name and email are required" });
    }

    // Attempt request to /fintech/onboard
    const response = await nibssService.post('/fintech/onboard', { name, email });

    res.status(201).json({
      message: "Fintech onboarded successfully",
      data: response.data
    });
  } catch (error) {
    console.error("NIBSS Target URL:", error.config?.baseURL + error.config?.url);
    console.error("NIBSS Error Response:", error.response?.data);

    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "Fintech onboarding failed", error: message });
  }
};

// 2. Authenticate Fintech & Obtain NIBSS JWT Access Token
exports.getFintechToken = async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ message: "apiKey and apiSecret are required" });
    }

    const response = await nibssService.post('/auth/token', { apiKey, apiSecret });

    res.status(200).json({
      message: "Authentication successful",
      token: response.data.token,
      fintech: response.data.fintech
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ message: "Fintech authentication failed", error: message });
  }
};