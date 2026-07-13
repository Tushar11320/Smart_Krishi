const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

module.exports = router;