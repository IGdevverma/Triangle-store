const express = require("express");

const router = express.Router();


// ============================================================
// CONTROLLERS
// ============================================================
const {
    registerUser,
    loginUser,
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
// TEST
// ============================================================

router.get("/test", (req, res) => {

    res.send("Auth Route Working");

});


// ============================================================
// REGISTER
// ============================================================

router.post(
    "/register",
    registerUser
);


// ============================================================
// LOGIN
// ============================================================

router.post(
    "/login",
    loginUser
);


// ============================================================
// SEND PHONE OTP
// ============================================================

router.post(
    "/send-phone-otp",
    isAuthenticatedUser,
    sendPhoneOtp
);


// ============================================================
// VERIFY PHONE OTP
// ============================================================

router.post(
    "/verify-phone-otp",
    isAuthenticatedUser,
    verifyPhoneOtp
);


// ============================================================
// RESEND PHONE OTP
// ============================================================

router.post(
    "/resend-phone-otp",
    isAuthenticatedUser,
    resendPhoneOtp
);

router.post(
    "/verify-widget-token",
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