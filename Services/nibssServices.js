
const axios = require('axios');
const nibssConfig = require('../config/nibssConfig');
const { getValidNibssToken } = require('../middleware/nibssMiddleware');

const nibssClient = axios.create({
  baseURL: nibssConfig.baseURL,
  timeout: 15000,
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

nibssClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await getValidNibssToken(true);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return nibssClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

module.exports = nibssClient;
