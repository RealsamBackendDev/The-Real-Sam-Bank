
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error) => {
  if (error) {
    console.warn('Email service not configured:', error.message);
  } else {
    console.log('Email service ready');
  }
});

exports.sendOtpEmail = async (toEmail, otp) => {
  try {
    const mailOptions = {
      from: `"The Real Sam Bank" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Account Verification Code - The Real Sam Bank',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Your Verification Code</h2>
          <p style="color: #666;">Use the following OTP to complete your verification:</p>
          <h1 style="color: #4A90E2; letter-spacing: 8px; font-size: 36px; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 4px;">${otp}</h1>
          <p style="color: #999; font-size: 12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('OTP email failed:', error.message);
    throw error;
  }
};

exports.sendTransactionAlert = async (toEmail, details) => {
  try {
    const { type, amount, account, transactionId } = details;
    const mailOptions = {
      from: `"The Real Sam Bank Alerts" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Transaction Alert: ${type}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
          <h3 style="color: #333; border-bottom: 2px solid #4A90E2; padding-bottom: 10px;">Transaction Notification</h3>
          <table style="width: 100%; color: #666;">
            <tr><td style="padding: 8px 0;"><strong>Type:</strong></td><td>${type}</td></tr>
            <tr><td style="padding: 8px 0;"><strong>Amount:</strong></td><td>₦${Number(amount).toLocaleString()}</td></tr>
            <tr><td style="padding: 8px 0;"><strong>Account:</strong></td><td>${account}</td></tr>
            <tr><td style="padding: 8px 0;"><strong>Reference:</strong></td><td>${transactionId}</td></tr>
            <tr><td style="padding: 8px 0;"><strong>Time:</strong></td><td>${new Date().toLocaleString()}</td></tr>
          </table>
        </div>
      `
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Transaction alert email failed:', error.message);
    throw error;
  }
};
