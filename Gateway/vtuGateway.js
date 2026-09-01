// Gateway/vtuGateway.js
const axios = require("axios");

exports.buyAirtime = async ({ phone, amount, network }) => {
  // Replace with actual VTU provider URL & keys in .env
  const response = await axios.post(
    `${process.env.VTU_BASE_URL}/airtime`,
    { phone, amount, network },
    { headers: { Authorization: `Bearer ${process.env.VTU_API_KEY}` } }
  );
  return response.data;
};

exports.buyData = async ({ phone, planId, network }) => {
  const response = await axios.post(
    `${process.env.VTU_BASE_URL}/data`,
    { phone, planId, network },
    { headers: { Authorization: `Bearer ${process.env.VTU_API_KEY}` } }
  );
  return response.data;
};



// const axios = require("axios");

// exports.buyAirtime = async ({ phone, amount, network }) => {
//   // Mock response for testing or point to your VTU provider URL
//   console.log(`Processing airtime purchase of ₦${amount} to ${phone} (${network})`);
//   return { status: "SUCCESS", phone, amount, network, txRef: `AIR-${Date.now()}` };
// };

// exports.buyData = async ({ phone, planId, network }) => {
//   console.log(`Processing data purchase plan ${planId} to ${phone} (${network})`);
//   return { status: "SUCCESS", phone, planId, network, txRef: `DAT-${Date.now()}` };
// };