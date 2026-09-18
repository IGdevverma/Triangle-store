const {
    initiateRefund
} = require("../services/refundService");
const PaymentVerification =
    require("../models/PaymentVerification");
    const RazorpayWebhookEvent =
    require("../models/RazorpayWebhookEvent");
const { calculatePricing } = require("../utils/pricing");
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
            razorpayPaymentId,
            couponCode
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
        // 3.1 VERIFY SERVER-SIDE PAYMENT RECORD
        // ==========================================

        const verifiedPayment =
            await PaymentVerification.findOne({
                razorpayOrderId,
                razorpayPaymentId,
                user: req.user._id
            });

        if (!verifiedPayment) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Payment has not been verified"
            });
        }

        // Make sure the verification record has not expired
        if (new Date() > verifiedPayment.expiresAt) {

            await PaymentVerification.deleteOne({
                _id: verifiedPayment._id
            });

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Payment verification has expired. Please try again."
            });
        }



        // ==========================================
        // 3.2 PREVENT REUSE OF VERIFIED PAYMENT
        // ==========================================

        const existingPaidOrder = await Order.findOne({
            razorpayOrderId,
            razorpayPaymentId,
            paymentStatus: "Paid"
        }).session(session);

        if (existingPaidOrder) {

            await session.abortTransaction();

            return res.status(409).json({
                success: false,
                message: "This payment has already been used for an order"
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

            const quantity = Number(item.quantity);

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


            // ==========================================
            // PACK INFORMATION
            // ==========================================

            const selectedPack =
                item.selectedPack || "single";

            let packQuantity = 1;
            let packPrice = Number(product.price || 0);

            // ------------------------------------------
            // SINGLE PIECE
            // ------------------------------------------

            if (selectedPack === "single") {

                packQuantity = 1;

                packPrice =
                    Number(product.price || 0);

            }

            // ------------------------------------------
            // PACK PRODUCT
            // ------------------------------------------

            else {

                const pack =
                    product.packs?.find(
                        p => p.id === selectedPack
                    );

                if (!pack) {

                    await session.abortTransaction();

                    return res.status(400).json({
                        success: false,
                        message:
                            `Selected pack is not available for ${product.name}`
                    });

                }

                packQuantity =
                    Number(pack.quantity || 1);

                packPrice =
                    Number(pack.price ?? product.price ?? 0);
            }

            // ==========================================
            // TOTAL PHYSICAL UNITS
            // ==========================================

            const totalUnits =
                quantity * packQuantity;

            // ==========================================
            // STOCK CHECK
            // ==========================================

            if (product.stock < totalUnits) {

                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message:
                        `Only ${product.stock} pieces of ${product.name} are available`
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
                    packPrice,

                quantity,

                packQuantity,

                selectedSize:
                    item.selectedSize || "",

                selectedColor:
                    item.selectedColor || "",

                selectedPack:
                    selectedPack,

                selectedCombination:
                    item.selectedCombination || "",

                totalUnits

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
        // CALCULATE PRICING
        // ==========================================

        let pricing;

        try {
            pricing = calculatePricing(
                items.map(item => ({
                    packPrice: item.price,
                    quantity: item.quantity
                })),
                couponCode
            );
        } catch (error) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        const {
            subtotal,
            discountAmount,
            taxableAmount,
            shipping,
            gst,
            total
        } = pricing;



        // ==========================================
        // 7.1 VERIFY PAYMENT AMOUNT
        // ==========================================

        const expectedPaymentAmount = Math.round(Number(total) * 100);

        if (
            verifiedPayment.amount !== expectedPaymentAmount ||
            verifiedPayment.currency !== "INR"
        ) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Payment amount does not match order total"
            });
        }

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
                                item.totalUnits
                        }
                    },

                    {
                        $inc: {
                            stock:
                                -item.totalUnits
                        }
                    },

                    {
                        returnDocument: "after",
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
                        user: req.user._id,

                        customerName,
                        email,
                        phone,
                        address,
                        city,
                        state,
                        pincode,

                        paymentMethod,

                        paymentStatus: "Paid",

                        razorpayOrderId,
                        razorpayPaymentId,

                        paymentVerifiedAt: new Date(),

                        items,
                        subtotal,
                        discountAmount,
                        shipping,
                        gst,
                        couponCode,

                        total,

                        orderStatus: "Processing",

                        trackingHistory: [
                            {
                                status: "Processing",
                                date: new Date()
                            }
                        ]
                    }
                ],
                {
                    session
                }
            );

        // ==========================================
        // 9.1 CONSUME VERIFIED PAYMENT ATOMICALLY
        // ==========================================

        const consumedPayment =
            await PaymentVerification.findOneAndDelete(
                {
                    _id: verifiedPayment._id,
                    user: req.user._id,
                    razorpayOrderId,
                    razorpayPaymentId
                },
                {
                    session
                }
            );

        if (!consumedPayment) {

            await session.abortTransaction();

            return res.status(409).json({
                success: false,
                message: "Payment verification could not be consumed"
            });
        }
        // ==========================================
        // 10. COMMIT
        // ==========================================

        await session.commitTransaction();


        // ==========================================
        // 10.1 RECONCILE RAZORPAY WEBHOOK EVENTS
        // ==========================================

        try {

            const reconciliationResult =
                await RazorpayWebhookEvent.updateMany(
                    {
                        razorpayOrderId: razorpayOrderId,
                        processed: false
                    },
                    {
                        $set: {
                            processed: true,
                            processedAt: new Date()
                        }
                    }
                );

            if (reconciliationResult.modifiedCount > 0) {

                console.log(
                    "✅ Razorpay webhook event(s) reconciled:",
                    razorpayOrderId,
                    reconciliationResult.modifiedCount
                );

            }

        } catch (webhookReconciliationError) {

            console.error(
                "⚠️ Webhook reconciliation failed:",
                webhookReconciliationError.message
            );

        }



        // ==========================================
        // 11. SEND ORDER EMAILS
        // ==========================================

        // ------------------------------------------
        // CUSTOMER ORDER CONFIRMATION
        // ------------------------------------------

        try {

            await EmailService
                .sendOrderPlaced(order);

            console.log(
                "✅ Customer order confirmation email sent."
            );

        } catch (customerMailError) {

            console.error(
                "❌ Customer order confirmation email failed:",
                customerMailError
            );

        }


        // ------------------------------------------
        // ADMIN NEW ORDER NOTIFICATION
        // ------------------------------------------

        try {

            await EmailService
                .sendAdminNewOrder(order);

            console.log(
                "✅ Admin order notification email sent."
            );

        } catch (adminMailError) {

            console.error(
                "❌ Admin order notification email failed:",
                adminMailError
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

        // ✅ Validate MongoDB ObjectId before querying
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {

            return res.status(404).json({

                success: false,

                message: "Order not found"

            });

        }

        if (req.user.role !== "admin" && order.user?.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not allowed to view this order"
            });
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

        const {
            orderStatus,
            cancellationReason
        } = req.body;

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
        // VALIDATE ORDER ID
        // ==========================================

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
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
        // ORDER STATUS TRANSITION RULES
        // ==========================================

        const allowedTransitions = {
            Processing: ["Packed", "Cancelled"],
            Packed: ["Shipped", "Cancelled"],
            Shipped: ["Delivered", "Cancelled"],
            Delivered: [],
            Cancelled: []
        };

        const currentStatus = order.orderStatus;

        if (
            currentStatus !== orderStatus &&
            !allowedTransitions[currentStatus].includes(orderStatus)
        ) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message:
                    `Order cannot be changed from ${currentStatus} to ${orderStatus}`
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
        // CANCELLATION DETAILS
        // ==========================================

        if (orderStatus === "Cancelled") {

            if (
                cancellationReason !== undefined &&
                typeof cancellationReason !== "string"
            ) {

                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message: "Invalid cancellation reason"
                });

            }

            const reason =
                String(cancellationReason || "").trim();

            if (reason.length > 250) {

                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message:
                        "Cancellation reason cannot exceed 250 characters"
                });

            }

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
                                stock: item.totalUnits
                            }
                        },

                        {
                            returnDocument: "after",
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

        order.orderStatus = orderStatus;

        // ==========================================
        // CANCELLATION DETAILS
        // ==========================================

        if (orderStatus === "Cancelled") {

            order.cancelledAt = new Date();

            order.cancellationReason =
                String(cancellationReason || "").trim() ||
                "Order cancelled";

            // Prepaid order:
            // cancellation does NOT mean refund is completed.
            if (order.paymentStatus === "Paid") {

                order.refundStatus = "Pending";

                order.refundAmount = order.total;

            }

        }

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
        // INITIATE REFUND AFTER TRANSACTION COMMIT
        // ==========================================

        if (
            orderStatus === "Cancelled" &&
            order.paymentStatus === "Paid" &&
            order.refundStatus === "Pending"
        ) {

            try {

                const refundResult =
                    await initiateRefund(
                        order,
                        order.cancellationReason
                    );

                order.refundStatus = "Processing";

                order.razorpayRefundId =
                    refundResult.refundId;

                order.refundInitiatedAt =
                    new Date();

                await order.save();

                console.log(
                    "✅ Razorpay refund initiated:",
                    refundResult.refundId
                );

            } catch (refundError) {

                console.error(
                    "❌ REFUND INITIATION FAILED:",
                    refundError.message
                );

                order.refundStatus = "Failed";

                order.refundFailureReason =
                    String(
                        refundError.message ||
                        "Unable to initiate refund"
                    ).slice(0, 250);

                await order.save();

            }
        }

        // ==========================================
        // EMAIL
        // ==========================================

        try {

            if (orderStatus === "Processing") {

                await EmailService
                    .sendOrderProcessing(order);

                console.log(
                    "✅ Processing email sent."
                );

            }
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

        if (session.inTransaction()) {
            await session.abortTransaction();
        }

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



