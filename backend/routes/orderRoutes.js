const express = require("express");

const router = express.Router();

const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
} = require("../controllers/orderController");
const { isAuthenticatedUser } = require("../middleware/auth");

router.route("/")
    .post(isAuthenticatedUser, createOrder)
    .get(isAuthenticatedUser, getOrders);

router.route("/:id")
    .get(isAuthenticatedUser, getOrderById)
    .put(isAuthenticatedUser, updateOrderStatus);

module.exports = router;
