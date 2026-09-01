const express = require("express");
const router = express.Router();
const { createAccount } = require("../controller/accountController");
const { protect } = require("../middleware/auth");


router.post("/create", protect, createAccount);

module.exports = router;