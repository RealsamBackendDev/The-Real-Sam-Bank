 
const axios = require('axios');
const nibssConfig = require('../config/nibssConfig');

const getValidNibssToken = async (forceRefresh = false) => {
  const now = Date.now();

  if (!forceRefresh && nibssConfig.token && nibssConfig.tokenExpiresAt && now < nibssConfig.tokenExpiresAt - 60000) {
    return nibssConfig.token;
  }

  const apiKey = nibssConfig.apiKey || process.env.NIBSS_API_KEY;
  const apiSecret = nibssConfig.apiSecret || process.env.NIBSS_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('NIBSS API credentials not configured. Onboard your fintech first.');
  }

  try {
    const response = await axios.post(`${nibssConfig.baseURL}/auth/token`, {
      apiKey,
      apiSecret
    });

    nibssConfig.token = response.data.token;
    nibssConfig.tokenExpiresAt = now + 3300000;

    return nibssConfig.token;
  } catch (error) {
    throw new Error('Failed to obtain NIBSS access token: ' + (error.response?.data?.message || error.message));
  }
};

module.exports = { getValidNibssToken };
