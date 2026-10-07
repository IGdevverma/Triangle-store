const express = require("express");

const router = express.Router();

const {
    optionalAuthentication
} = require("../middleware/auth");

const {
    createOrder,
    verifyPayment
} = require("../controllers/paymentController");


// ============================================================
// CREATE RAZORPAY ORDER
// Supports:
// - Logged-in users
// - OTP-verified guests
// ============================================================

router.post(
    "/create-order",
    optionalAuthentication,
    createOrder
);


// ============================================================
// VERIFY RAZORPAY PAYMENT
// Supports:
// - Logged-in users
// - OTP-verified guests
// ============================================================

router.post(
    "/verify",
    optionalAuthentication,
    verifyPayment
);


module.exports = router;