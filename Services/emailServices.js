const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send OTP Email
exports.sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"The Real Sam Bank" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Account verification Code - The Real Sam Bank',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Your Verification Code</h2>
        <p>Use the following OTP to complete your verification:</p>
        <h1 style="color: #4A90E2; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

// Send Transaction Alert Email
exports.sendTransactionAlert = async (toEmail, details) => {
  const { type, amount, account, transactionId } = details;
  const mailOptions = {
    from: `"The Real Sam Bank Alerts" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Transaction Alert: ${type}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h3>Transaction Notification</h3>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Amount:</strong> ₦${amount}</p>
        <p><strong>Account:</strong> ${account}</p>
        <p><strong>Reference:</strong> ${transactionId}</p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};