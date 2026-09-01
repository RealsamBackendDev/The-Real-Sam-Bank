const express = require("express");
const router = express.Router();
const { verifyIdentity } = require("../controller/onboardingController");
const { protect } = require("../middleware/auth");


router.post("/verify_identity", protect, verifyIdentity);

module.exports = router;