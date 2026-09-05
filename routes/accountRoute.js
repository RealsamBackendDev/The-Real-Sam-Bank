const express = require('express');
const router = express.Router();
const accountController = require('../controller/accountController');
const { protect } = require('../middleware/auth');


router.post('/create', protect, accountController.createNewAccount);
router.get('/balance/:accountNumber', protect, accountController.getAccountBalance);

module.exports = router;