const express = require("express");

const router = express.Router();


// ============================================================
// CONTROLLERS
// ============================================================

const {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    sendPhoneOtp,
    verifyPhoneOtp,
    resendPhoneOtp,
    verifyWidgetToken,
    updateProfile
} = require("../controllers/authController");


// ============================================================
// AUTH MIDDLEWARE
// ============================================================

const {
    isAuthenticatedUser
} = require("../middleware/auth");


// ============================================================
// RATE LIMITERS
// ============================================================

const {
    authLimiter,
    otpLimiter,
    widgetLimiter
} = require("../middleware/rateLimiter");


// ============================================================
// TEST
// ============================================================

router.get(
    "/test",
    (req, res) => {
        res.send("Auth Route Working");
    }
);


// ============================================================
// REGISTER
// ============================================================

router.post(
    "/register",
    authLimiter,
    registerUser
);


// ============================================================
// LOGIN
// ============================================================

router.post(
    "/login",
    authLimiter,
    loginUser
);

router.post("/forgot-password", authLimiter, forgotPassword);
router.put("/reset-password/:token", authLimiter, resetPassword);


// ============================================================
// SEND PHONE OTP
// ============================================================

router.post(
    "/send-phone-otp",
    isAuthenticatedUser,
    otpLimiter,
    sendPhoneOtp
);


// ============================================================
// VERIFY PHONE OTP
// ============================================================

router.post(
    "/verify-phone-otp",
    isAuthenticatedUser,
    otpLimiter,
    verifyPhoneOtp
);


// ============================================================
// RESEND PHONE OTP
// ============================================================

router.post(
    "/resend-phone-otp",
    isAuthenticatedUser,
    otpLimiter,
    resendPhoneOtp
);


// ============================================================
// VERIFY WIDGET TOKEN
// ============================================================

router.post(
    "/verify-widget-token",
    widgetLimiter,
    verifyWidgetToken
);


// ============================================================
// UPDATE PROFILE
// ============================================================

router.put(
    "/profile",
    isAuthenticatedUser,
    updateProfile
);


module.exports = router;