const express = require('express');
const router = express.Router();
const accountController = require('../controller/accountController');
const protect = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');

router.post('/create', protect, apiLimiter, accountController.createNewAccount);
router.get('/all', protect, accountController.getAllAccounts);
router.get('/balance/:accountNumber', protect, accountController.getAccountBalance);
router.get('/search/:identifier', protect, accountController.getAccountByIdentifier);
router.put('/update/:accountNumber', protect, accountController.updateAccountDetails);
router.patch('/status/:accountNumber', protect, accountController.setAccountStatus);
router.delete('/delete/:accountNumber', protect, accountController.deleteAccount);

module.exports = router;
