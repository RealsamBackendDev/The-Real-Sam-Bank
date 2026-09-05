const axios = require('axios');
const nibssConfig = require('../config/nibssConfig');
const { getValidNibssToken } = require('../middleware/nibssMiddleware');

const nibssClient = axios.create({
  baseURL: nibssConfig.baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

nibssClient.interceptors.request.use(
  async (config) => {
    if (!config.url.includes('/fintech/onboard') && !config.url.includes('/auth/token')) {
      const token = await getValidNibssToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

module.exports = nibssClient;