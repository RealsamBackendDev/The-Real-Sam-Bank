// Services/smsService.js
const axios = require('axios');

exports.sendOtpSms = async (phone, otp) => {
  try {
    if (!process.env.VTPASS_API_KEY) return;
    await axios.post('https://vtpass.com/api/sms', {
      recipient: phone,
      message: `Your verification code is ${otp}. Expires in 10 minutes.`,
      sender: 'The Real Sam Bank'
    }, {
      headers: { 'api-key': process.env.VTPASS_API_KEY }
    });
  } catch (error) {
    console.error('SMS sending failed:', error.message);
  }
};