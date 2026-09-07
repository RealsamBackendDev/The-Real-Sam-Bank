 
const axios = require('axios');

exports.sendOtpSms = async (phone, otp) => {
  try {
    if (!process.env.VTPASS_API_KEY) {
      console.warn('VTPASS_API_KEY not set. Skipping SMS.');
      return;
    }

    if (!phone || !/^\d{11}$/.test(phone)) {
      console.warn('Invalid phone number format. Skipping SMS.');
      return;
    }

    await axios.post('https://vtpass.com/api/sms', {
      recipient: phone,
      message: `Your Real Sam Bank verification code is ${otp}. Expires in 10 minutes. Do not share.`,
      sender: 'RealSamBank'
    }, {
      headers: { 'api-key': process.env.VTPASS_API_KEY },
      timeout: 10000
    });
  } catch (error) {
    console.error('SMS sending failed:', error.response?.data?.message || error.message);
  }
};
