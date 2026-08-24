const mongoose = require("mongoose");
const EmailService = require("../services/emailService");
const Order = require("../models/Order");
const Product = require("../models/Product");







// Create Order
// Create Order
const createOrder = async (req, res) => {

    const session = await mongoose.startSession();

    try {

        session.startTransaction();

        // ==========================================
        // 1. GET CUSTOMER DATA
        // ==========================================

        const {
            customerName,
            email,
            phone,
            address,
            city,
            state,
            pincode,
            paymentMethod,
            razorpayOrderId,
            razorpayPaymentId
        } = req.body;

        // ==========================================
        // 2. BASIC VALIDATION
        // ==========================================

        if (
            !customerName ||
            !email ||
            !phone ||
            !address ||
            !city ||
            !state ||
            !pincode ||
            !paymentMethod
        ) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message:
                    "Complete customer and delivery details are required"
            });
        }

        // ==========================================
        // 3. PAYMENT VALIDATION
        // ==========================================

        if (
            paymentMethod !== "UPI" &&
            paymentMethod !== "CARD" &&
            paymentMethod !== "NETBANKING" &&
            paymentMethod !== "WALLET"
        ) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment method"
            });
        }

        if (
            !razorpayOrderId ||
            !razorpayPaymentId
        ) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message:
                    "Payment information is missing"
            });
        }

        // ==========================================
        // 4. PREVENT DUPLICATE RAZORPAY ORDER
        // ==========================================

        const existingOrder =
            await Order.findOne({
                razorpayOrderId
            }).session(session);

        if (existingOrder) {

            await session.abortTransaction();

            return res.status(200).json({
                success: true,
                message:
                    "Order already exists",
                order: existingOrder
            });
        }

        // ==========================================
        // 5. GET PRODUCTS FROM DATABASE
        // ==========================================

        const items = [];

        for (const item of req.body.items || []) {

            const productId =
                item.productId ||
                item._id ||
                item.id;

            const product =
                await Product.findById(
                    productId
                ).session(session);

            if (!product) {

                await session.abortTransaction();

                return res.status(404).json({
                    success: false,
                    message:
                        `${item.name || "Product"} not found`
                });
            }

            const quantity =
                Number(item.quantity);

            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {

                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message:
                        `Invalid quantity for ${product.name}`
                });
            }

            // Initial stock check
            if (
                product.stock < quantity
            ) {

                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message:
                        `Only ${product.stock} ${product.name} left in stock`
                });
            }

            items.push({

                productId:
                    product._id.toString(),

                name:
                    product.name,

                image:
                    product.image,

                price:
                    product.price,

                quantity

            });
        }

        // ==========================================
        // 6. CART EMPTY CHECK
        // ==========================================

        if (!items.length) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        // ==========================================
        // 7. CALCULATE TOTAL FROM DATABASE
        // ==========================================

        const subtotal =
            items.reduce(
                (sum, item) =>
                    sum +
                    item.price *
                    item.quantity,
                0
            );

        const shipping =
            subtotal >= 1999
                ? 0
                : 99;

        const gst =
            Math.round(
                subtotal * 0.18
            );

        const total =
            subtotal +
            shipping +
            gst;

        // ==========================================
        // 8. ATOMIC STOCK DEDUCTION
        // ==========================================

        for (const item of items) {

            const updatedProduct =
                await Product.findOneAndUpdate(

                    {
                        _id:
                            item.productId,

                        stock: {
                            $gte:
                                item.quantity
                        }
                    },

                    {
                        $inc: {
                            stock:
                                -item.quantity
                        }
                    },

                    {
                        new: true,
                        session
                    }
                );

            if (!updatedProduct) {

                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message:
                        `${item.name} is no longer available in the requested quantity`
                });
            }
        }

        // ==========================================
        // 9. CREATE ORDER
        // ==========================================

        const [order] =
            await Order.create(
                [
                    {

                        user:
                            req.user._id,

                        customerName,

                        email,

                        phone,

                        address,

                        city,

                        state,

                        pincode,

                        paymentMethod,

                        // Payment already verified
                        paymentStatus:
                            "Paid",

                        razorpayOrderId,

                        razorpayPaymentId,

                        paymentVerifiedAt:
                            new Date(),

                        items,

                        total,

                        orderStatus:
                            "Processing",

                        trackingHistory: [
                            {
                                status:
                                    "Processing",

                                date:
                                    new Date()
                            }
                        ]

                    }
                ],
                {
                    session
                }
            );

        // ==========================================
        // 10. COMMIT
        // ==========================================

        await session.commitTransaction();

        // ==========================================
        // 11. SEND EMAIL
        // ==========================================

        try {

            await EmailService
                .sendOrderPlaced(order);

            console.log(
                "✅ Order confirmation email sent."
            );

        } catch (mailError) {

            console.error(
                "❌ Order confirmation email failed:",
                mailError
            );

        }

        // ==========================================
        // 12. RESPONSE
        // ==========================================

        return res.status(201).json({

            success: true,

            message:
                "Order Placed Successfully",

            order

        });

    } catch (error) {

        await session.abortTransaction();

        console.error(
            "ORDER ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    } finally {

        session.endSession();

    }
};


// Get All Orders

const getOrders = async (req, res) => {

    try {

        const filter = req.user.role === "admin" ? {} : { user: req.user._id };
        const orders = await Order.find(filter).sort({

            createdAt: -1

        });

        res.status(200).json({

            success: true,

            orders

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

const getOrderById = async (req, res) => {

    try {

        const order = await Order.findById(req.params.id);

        if (!order) {

            return res.status(404).json({

                success: false,

                message: "Order not found"

            });

        }

        if (req.user.role !== "admin" && order.user?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not allowed to view this order" });
        }

        res.status(200).json({

            success: true,

            order

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// Update Order Status

const updateOrderStatus = async (req, res) => {

    const session = await mongoose.startSession();

    try {

        const { orderStatus } = req.body;

        // ==========================================
        // VALID STATUS
        // ==========================================

        const allowedStatuses = [
            "Processing",
            "Packed",
            "Shipped",
            "Delivered",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(orderStatus)) {

            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });

        }

        // ==========================================
        // START TRANSACTION
        // ==========================================

        session.startTransaction();

        const order =
            await Order.findById(
                req.params.id
            ).session(session);

        if (!order) {

            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        // ==========================================
        // AUTHORIZATION
        // ==========================================

        const isAdmin =
            req.user.role === "admin";

        const isOwner =
            order.user?.toString() ===
            req.user._id.toString();

        // Customer can ONLY cancel own order
        if (
            !isAdmin &&
            (!isOwner ||
                orderStatus !== "Cancelled")
        ) {

            await session.abortTransaction();

            return res.status(403).json({
                success: false,
                message:
                    "Not allowed to update this order"
            });

        }

        // ==========================================
        // ALREADY CANCELLED
        // ==========================================

        if (
            order.orderStatus === "Cancelled"
        ) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message:
                    "Order is already cancelled"
            });

        }

        // ==========================================
        // DELIVERED ORDER CANNOT BE CANCELLED
        // ==========================================

        if (
            order.orderStatus === "Delivered" &&
            orderStatus === "Cancelled"
        ) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message:
                    "Delivered orders cannot be cancelled"
            });

        }

        // ==========================================
        // CUSTOMER CANCELLATION RULE
        // ==========================================

        if (
            !isAdmin &&
            orderStatus === "Cancelled" &&
            (
                order.orderStatus === "Shipped" ||
                order.orderStatus === "Delivered"
            )
        ) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message:
                    "Order cannot be cancelled after shipping"
            });

        }

        // ==========================================
        // STOCK RESTORE ON CANCELLATION
        // ==========================================

        if (
            orderStatus === "Cancelled"
        ) {

            // Only restore stock when cancelling
            // an order that has not already been cancelled.

            for (const item of order.items) {

                const updatedProduct =
                    await Product.findByIdAndUpdate(

                        item.productId,

                        {
                            $inc: {
                                stock:
                                    item.quantity
                            }
                        },

                        {
                            new: true,
                            session
                        }

                    );

                if (!updatedProduct) {

                    await session.abortTransaction();

                    return res.status(404).json({
                        success: false,
                        message:
                            `Product ${item.name} no longer exists`
                    });

                }

            }

        }

        // ==========================================
        // UPDATE ORDER STATUS
        // ==========================================

        order.orderStatus =
            orderStatus;

        // ==========================================
        // TRACKING HISTORY
        // ==========================================

        order.trackingHistory.push({

            status:
                orderStatus,

            date:
                new Date()

        });

        await order.save({
            session
        });

        // ==========================================
        // COMMIT TRANSACTION
        // ==========================================

        await session.commitTransaction();

        // ==========================================
        // EMAIL
        // ==========================================

        try {

            if (
                orderStatus === "Packed"
            ) {

                await EmailService
                    .sendOrderPacked(order);

                console.log(
                    "✅ Packed email sent."
                );

            }

            if (
                orderStatus === "Shipped"
            ) {

                await EmailService
                    .sendOrderShipped(order);

                console.log(
                    "✅ Shipped email sent."
                );

            }

            if (
                orderStatus === "Delivered"
            ) {

                await EmailService
                    .sendOrderDelivered(order);

                console.log(
                    "✅ Delivered email sent."
                );

            }

            if (
                orderStatus === "Cancelled"
            ) {

                await EmailService
                    .sendOrderCancelled(order);

                console.log(
                    "✅ Cancellation email sent."
                );

            }

        } catch (mailError) {

            console.error(
                "❌ Order status email failed:",
                mailError
            );

        }

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Order status updated",

            order

        });

    } catch (error) {

        await session.abortTransaction();

        console.error(
            "UPDATE ORDER STATUS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    } finally {

        session.endSession();

    }

};
module.exports = {

    createOrder,

    getOrders,

    updateOrderStatus,
    getOrderById


};



