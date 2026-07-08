const express = require("express");

const router = express.Router();

const {
    createOrder,
    getOrders,
    updateOrderStatus
} = require("../controllers/orderController");

router.route("/")
    .post(createOrder)
    .get(getOrders);

router.route("/:id")
    .put(updateOrderStatus);

module.exports = router;