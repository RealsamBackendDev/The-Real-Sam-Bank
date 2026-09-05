const axios = require('axios');

let cachedNibssToken = null;
let tokenExpiresAt = null;

const getValidNibssToken = async () => {
  const now = new Date();
  
  // Return cached token if still valid (with 1-minute buffer)
  if (cachedNibssToken && tokenExpiresAt && now < tokenExpiresAt) {
    return cachedNibssToken;
  }

  try {
    const baseURL = process.env.NIBSS_BASE_URL || 'https://nibssbyphoenix.onrender.com/api';
    const response = await axios.post(`${baseURL}/auth/token`, {
      apiKey: process.env.NIBSS_API_KEY,
      apiSecret: process.env.NIBSS_API_SECRET
    });

    cachedNibssToken = response.data.token;
  
    tokenExpiresAt = new Date(now.getTime() + 55 * 60 * 1000);

    return cachedNibssToken;
  } catch (error) {
    throw new Error('Failed to obtain NIBSS access token: ' + (error.response?.data?.message || error.message));
  }
};

module.exports = { getValidNibssToken };