const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middleware/auth");

const {
  createOrder,
  verifyPayment
} = require("../controllers/paymentController");

router.post("/create-order", isAuthenticatedUser, createOrder);
router.post("/verify", isAuthenticatedUser, verifyPayment);

module.exports = router;
