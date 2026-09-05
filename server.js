const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/databaseConfig');
const { apiLimiter } = require('./Middleware/rateLimit');

dotenv.config();


connectDB();

const app = express();

app.use(express.json());
app.use(apiLimiter);


app.use('/api/auth', require('./Routes/AuthRoute'));
app.use('/api/nibss', require('./Routes/OnboardingRoutes'));
app.use('/api/identity', require('./Routes/identityRoute'));
app.use('/api/account', require('./Routes/accountRoute'));
app.use('/api/transaction', require('./Routes/transactionRoute'));
app.use('/api/webhook', require('./routes/webhookRoute'));

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});