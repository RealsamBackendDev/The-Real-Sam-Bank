const express = require('express'); 
const dotenv = require('dotenv'); 
const cors = require('cors'); 

const connectDB = require('./config/databaseConfig');
dotenv.config();

connectDB();

const app = express();

app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }); });
app.use('/api/auth', require('./routes/authRoute')); app.use('/api/nibss', require('./routes/onboardingRoute')); 
app.use('/api/identity', require('./routes/identityRoute')); app.use('/api/account', require('./routes/accountRoute')); 
app.use('/api/transaction', require('./routes/transactionRoute')); app.use('/api/webhook', require('./routes/webhookRoute'));
app.use((req, res) => {  res.status(404).json({ message:  Route ${req.originalUrl} not found  }); });

app.use((err, req, res, next) => {  console.error(err.stack);  res.status(err.status || 500).json({  message: err.message || 'Internal Server Error',  ...(process.env.NODE_ENV === 'development' && { stack: err.stack })  }); });

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {  console.log( Server running on port ${PORT} ); });
