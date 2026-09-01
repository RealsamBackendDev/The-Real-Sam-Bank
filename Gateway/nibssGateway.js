const axios = require("axios");
const BASE_URL = process.env.NIBSS_BASE_URL;

let cachedToken = null;


const getAuthToken = async () => {
  if (cachedToken) return cachedToken;

  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/login`,
      {
        apiKey: process.env.NIBSS_API_KEY,
        apiSecret: process.env.NIBSS_API_SECRET
      },
      { timeout: 60000 }
    );

    cachedToken =
      response.data?.token ||
      response.data?.accessToken ||
      response.data?.data?.token;

    if (!cachedToken) {
      throw new Error("No token returned in auth response payload.");
    }

    return cachedToken;
  } catch (error) {
    console.error(
      "NIBSS AUTH ERROR DETAILED:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to authenticate with Nibss API: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};


const nibssClient = async (endpoint, method = "GET", data = null) => {
  const token = await getAuthToken();

  try {
    const response = await axios({
      url: `${BASE_URL}${endpoint}`,
      method,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      timeout: 60000
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      cachedToken = null; 
    }

    console.error(
      `NIBSS API ERROR [${method} ${endpoint}]:`,
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

module.exports = {
  createBvn: async ({ bvn, firstName, lastName, dob, phone }) => {
    return await nibssClient("/api/createbvn", "POST", {
      bvn,
      firstName,
      lastName,
      dob,
      phone
    });
  },

  
  createNin: async (ninData) => {
    const payload = typeof ninData === "string" ? { nin: ninData } : ninData;
    return await nibssClient("/api/createnin", "POST", payload);
  },

  
  createAccount: async ({ kycType, kycID, dob }) => {
    return await nibssClient("/api/account/create", "POST", {
      kycType,
      kycID,
      dob
    });
  },

  
  nameEnquiry: async (accountNumber) => {
    return await nibssClient(
      `/api/account/name-enquiry/${accountNumber}`,
      "GET"
    );
  },

 
  transferFunds: async (fromAccount, toAccount, amount) => {
    return await nibssClient("/api/transfer", "POST", {
      from: fromAccount,
      to: toAccount,
      amount
    });
  }
};