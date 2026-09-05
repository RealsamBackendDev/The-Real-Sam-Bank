const axios = require('axios');
const nibssConfig = require('../config/nibssConfig');
const { getValidNibssToken } = require('../middleware/nibssMiddleware');

const nibssClient = axios.create({
  baseURL: nibssConfig.baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach NIBSS Bearer token automatically
nibssClient.interceptors.request.use(
  async (config) => {
    // Skip token injection for unauthenticated onboarding and auth endpoints
    if (!config.url.includes('/onboard') && !config.url.includes('/auth/token')) {
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