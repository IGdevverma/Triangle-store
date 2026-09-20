const express = require("express");

const router = express.Router();

const {
    createOrder,
    getOrders,
    getOrderById,
    createShipment,
    assignAwb,
    updateOrderStatus,
    generatePickup,
    trackShipment
} = require("../controllers/orderController");
const {
    isAuthenticatedUser,
    authorizeRoles
} = require("../middleware/auth");

router.route("/")
    .post(isAuthenticatedUser, createOrder)
    .get(isAuthenticatedUser, getOrders);


// ==========================================================
// SHIPROCKET — ADMIN ONLY
// ==========================================================

router.post(
    "/:id/shiprocket/create",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    createShipment
);
// ==========================================================
// SHIPROCKET — ASSIGN AWB
// ADMIN ONLY
// ==========================================================

router.post(
    "/:id/shiprocket/awb",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    assignAwb
);


router.post(
    "/:id/shiprocket/pickup",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    generatePickup
);
router.get(
    "/:id/shiprocket/tracking",
    isAuthenticatedUser,
    trackShipment
);

router.route("/:id")
    .get(isAuthenticatedUser, getOrderById)
    .put(isAuthenticatedUser, updateOrderStatus);

module.exports = router;
