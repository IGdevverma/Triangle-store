const PaymentVerification = require("../models/PaymentVerification");
const { calculatePricing } = require("../utils/pricing");
const RazorpayWebhookEvent = require("../models/RazorpayWebhookEvent");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Order = require("../models/Order");
const Product = require("../models/Product");
const razorpay = require("../config/razorpay");


// ============================================================
// RESOLVE PAYMENT ACTOR
// ============================================================
//
// Supports:
// 1. Logged-in authenticated users
// 2. OTP-verified guest users
//
// Guest users MUST provide the server-issued
// X-Guest-Verification-Token header.
//
// ============================================================

const resolvePaymentActor = (req) => {

    // ========================================================
    // 1. LOGGED-IN USER
    // ========================================================

    if (req.user) {

        return {
            type: "user",

            userId: req.user._id,

            verifiedPhone:
                req.user.phone || null
        };
    }


    // ========================================================
    // 2. GUEST USER
    // ========================================================

    const guestToken =
        req.headers["x-guest-verification-token"];


    if (
        !guestToken ||
        typeof guestToken !== "string"
    ) {

        const error =
            new Error(
                "Phone verification is required"
            );

        error.statusCode = 401;

        throw error;
    }


    // ========================================================
    // 3. VERIFY SERVER-SIGNED GUEST TOKEN
    // ========================================================

    let decoded;

    try {

        decoded = jwt.verify(
            guestToken.trim(),
            process.env.JWT_SECRET
        );

    } catch (error) {

        const authError =
            new Error(
                "Guest phone verification has expired. Please verify your mobile number again."
            );

        authError.statusCode = 401;

        throw authError;
    }


    // ========================================================
    // 4. VALIDATE TOKEN PAYLOAD
    // ========================================================

    if (
        !decoded ||
        decoded.type !==
            "guest_phone_verification" ||
        !decoded.phone
    ) {

        const error =
            new Error(
                "Invalid guest verification token"
            );

        error.statusCode = 401;

        throw error;
    }


    // ========================================================
    // 5. RETURN GUEST ACTOR
    // ========================================================

    return {

        type: "guest",

        userId: null,

        verifiedPhone:
            decoded.phone
    };
};



// ============================================================
// CREATE RAZORPAY ORDER
// ============================================================

exports.createOrder = async (req, res) => {

    try {

        // ======================================================
        // RESOLVE USER / GUEST
        // ======================================================

        const paymentActor =
            resolvePaymentActor(req);


        console.log(
            "RAZORPAY ORDER REQUEST:",
            {
                type:
                    paymentActor.type,

                userId:
                    paymentActor.userId || null
            }
        );


        // ======================================================
        // REQUEST DATA
        // ======================================================

        const {
            couponCode,
            items
        } = req.body;


        // ======================================================
        // VALIDATE ITEMS
        // ======================================================

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Order items are required"
            });
        }


        // ======================================================
        // VERIFY PRODUCTS FROM DATABASE
        // ======================================================

        const verifiedItems = [];


        for (const item of items) {

            // --------------------------------------------------
            // PRODUCT ID
            // --------------------------------------------------

            const productId =
                item.productId ||
                item._id ||
                item.id;


            if (!productId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Product ID is missing"
                });
            }


            // --------------------------------------------------
            // FIND PRODUCT
            // --------------------------------------------------

            const product =
                await Product.findById(productId);


            if (!product) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Product not found"
                });
            }


            // --------------------------------------------------
            // QUANTITY
            // --------------------------------------------------

            const quantity =
                Number(item.quantity);


            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Invalid quantity for ${product.name}`
                });
            }


            // ==================================================
            // PACK PRICE
            // ==================================================

            const selectedPack =
                item.selectedPack || "single";


            let packQuantity = 1;

            let packPrice =
                Number(product.price || 0);


            // --------------------------------------------------
            // PACK PRODUCT
            // --------------------------------------------------

            if (
                selectedPack !== "single"
            ) {

                const pack =
                    product.packs?.find(
                        (p) =>
                            p.id === selectedPack
                    );


                if (!pack) {

                    return res.status(400).json({

                        success: false,

                        message:
                            `Selected pack is not available for ${product.name}`
                    });
                }


                packQuantity =
                    Number(
                        pack.quantity || 1
                    );


                packPrice =
                    Number(
                        pack.price ??
                        product.price ??
                        0
                    );
            }


            // ==================================================
            // TOTAL PHYSICAL UNITS
            // ==================================================

            const totalUnits =
                quantity *
                packQuantity;


            // ==================================================
            // STOCK CHECK
            // ==================================================

            if (
                Number(product.stock) <
                totalUnits
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Only ${product.stock} pieces of ${product.name} are available`
                });
            }


            // ==================================================
            // STORE VERIFIED ITEM
            // ==================================================

            verifiedItems.push({

                productId:
                    product._id.toString(),

                quantity,

                packQuantity,

                packPrice,

                selectedPack,

                totalUnits
            });
        }


        // ======================================================
        // SERVER-SIDE PRICE CALCULATION
        // ======================================================

        let pricing;


        try {

            pricing =
                calculatePricing(
                    verifiedItems,
                    couponCode
                );

        } catch (error) {

            console.error(
                "CREATE ORDER PRICING ERROR:",
                error.message
            );


            return res.status(400).json({

                success: false,

                message:
                    error.message
            });
        }


        // ======================================================
        // PRICING RESULT
        // ======================================================

        const {

            subtotal,

            discountAmount,

            taxableAmount,

            shipping,

            gst,

            total

        } = pricing;


        // ======================================================
        // CONVERT TO PAISE
        // ======================================================

        const totalInPaise =
            Math.round(
                Number(total) * 100
            );


        if (
            !Number.isInteger(totalInPaise) ||
            totalInPaise <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid order total"
            });
        }


        // ======================================================
        // RAZORPAY ORDER OPTIONS
        // ======================================================

        const options = {

            amount:
                totalInPaise,

            currency:
                "INR",

            receipt:
                `receipt_${Date.now()}`
        };


        // ======================================================
        // DEBUG LOG
        // ======================================================

        console.log(
            "========== RAZORPAY CREATE =========="
        );

        console.log(
            "Actor:",
            paymentActor.type
        );

        console.log(
            "Subtotal:",
            subtotal
        );

        console.log(
            "Discount:",
            discountAmount
        );

        console.log(
            "Taxable:",
            taxableAmount
        );

        console.log(
            "Shipping:",
            shipping
        );

        console.log(
            "GST:",
            gst
        );

        console.log(
            "Final Total:",
            total
        );

        console.log(
            "Amount Paise:",
            totalInPaise
        );

        console.log(
            "Coupon:",
            couponCode || null
        );

        console.log(
            "Items:",
            verifiedItems
        );


        // ======================================================
        // CREATE RAZORPAY ORDER
        // ======================================================

        const order =
            await razorpay.orders.create(
                options
            );


        // ======================================================
        // RESPONSE
        // ======================================================

        return res.status(200).json({

            success: true,

            order,

            key:
                process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {

        console.error(
            "CREATE RAZORPAY ORDER ERROR:",
            error
        );


        return res.status(
            error.statusCode || 500
        ).json({

            success: false,

            message:
                error.statusCode
                    ? error.message
                    : "Unable to create payment order"
        });
    }
};



// ============================================================
// VERIFY RAZORPAY PAYMENT
// ============================================================

exports.verifyPayment = async (req, res) => {

    try {

        // ======================================================
        // RESOLVE USER / GUEST
        // ======================================================

        const paymentActor =
            resolvePaymentActor(req);


        // ======================================================
        // REQUEST DATA
        // ======================================================

        const {

            razorpay_order_id,

            razorpay_payment_id,

            razorpay_signature

        } = req.body;


        // ======================================================
        // 1. VALIDATE PAYMENT DATA
        // ======================================================

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Incomplete payment details"
            });
        }


        // ======================================================
        // 2. VERIFY RAZORPAY SIGNATURE
        // ======================================================

        const body =
            razorpay_order_id +
            "|" +
            razorpay_payment_id;


        const expectedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(body)
                .digest("hex");


        const receivedBuffer =
            Buffer.from(
                razorpay_signature,
                "utf8"
            );


        const expectedBuffer =
            Buffer.from(
                expectedSignature,
                "utf8"
            );


        if (
            receivedBuffer.length !==
                expectedBuffer.length ||
            !crypto.timingSafeEqual(
                receivedBuffer,
                expectedBuffer
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment signature"
            });
        }


        // ======================================================
        // 3. FETCH ACTUAL PAYMENT FROM RAZORPAY
        // ======================================================

        const payment =
            await razorpay.payments.fetch(
                razorpay_payment_id
            );


        // ======================================================
        // 4. FETCH RAZORPAY ORDER
        // ======================================================

        const razorpayOrder =
            await razorpay.orders.fetch(
                razorpay_order_id
            );


        // ======================================================
        // 5. VERIFY PAYMENT AMOUNT
        // ======================================================

        if (
            Number(payment.amount) !==
            Number(razorpayOrder.amount)
        ) {

            console.error(
                "PAYMENT AMOUNT MISMATCH:",
                {
                    expected:
                        razorpayOrder.amount,

                    received:
                        payment.amount
                }
            );


            return res.status(400).json({

                success: false,

                message:
                    "Payment amount mismatch"
            });
        }


        // ======================================================
        // 6. VERIFY RAZORPAY ORDER STATUS
        // ======================================================

        if (
            razorpayOrder.status !==
            "paid"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Razorpay order is not marked as paid"
            });
        }


        // ======================================================
        // 7. PAYMENT MUST BELONG TO ORDER
        // ======================================================

        if (
            payment.order_id !==
            razorpay_order_id
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Payment does not belong to this order"
            });
        }


        // ======================================================
        // 8. VERIFY CURRENCY
        // ======================================================

        if (
            payment.currency !== "INR" ||
            razorpayOrder.currency !== "INR"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment currency"
            });
        }


        // ======================================================
        // 9. PAYMENT MUST BE CAPTURED
        // ======================================================

        if (
            payment.status !==
            "captured"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Payment is not captured. Current status: ${payment.status}`
            });
        }


        // ======================================================
        // 10. SAVE SERVER-SIDE PAYMENT VERIFICATION
        // ======================================================

        await PaymentVerification.findOneAndUpdate(

            {
                razorpayOrderId:
                    razorpay_order_id
            },

            {

                user:
                    paymentActor.userId,

                verifiedPhone:
                    paymentActor.verifiedPhone,

                razorpayOrderId:
                    razorpay_order_id,

                razorpayPaymentId:
                    razorpay_payment_id,

                amount:
                    Number(
                        razorpayOrder.amount
                    ),

                currency:
                    razorpayOrder.currency,

                verifiedAt:
                    new Date(),

                expiresAt:
                    new Date(
                        Date.now() +
                        15 * 60 * 1000
                    )
            },

            {

                upsert: true,

                returnDocument:
                    "after",

                setDefaultsOnInsert:
                    true
            }
        );


        // ======================================================
        // 11. SUCCESS
        // ======================================================

        return res.status(200).json({

            success: true,

            message:
                "Payment verified successfully",

            razorpayOrderId:
                razorpay_order_id,

            razorpayPaymentId:
                razorpay_payment_id,

            paymentStatus:
                "Paid"
        });

    } catch (error) {

        console.error(
            "VERIFY PAYMENT ERROR:",
            error
        );


        return res.status(
            error.statusCode || 500
        ).json({

            success: false,

            message:
                error.statusCode
                    ? error.message
                    : "Unable to verify payment"
        });
    }
};

exports.handleWebhook = async (req, res) => {

    const signature = req.headers["x-razorpay-signature"];
    const eventId = req.headers["x-razorpay-event-id"];

    const webhookSecret =
        process.env.RAZORPAY_WEBHOOK_SECRET;

    // -----------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------

    if (!signature || !webhookSecret) {

        return res.status(400).json({
            success: false,
            message: "Webhook is not configured"
        });

    }

    // -----------------------------------------
    // VERIFY RAZORPAY SIGNATURE
    // -----------------------------------------

    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(req.body)
        .digest("hex");

    const signatureBuffer =
        Buffer.from(signature, "utf8");

    const expectedBuffer =
        Buffer.from(expectedSignature, "utf8");

    if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(
            signatureBuffer,
            expectedBuffer
        )
    ) {

        console.error("❌ Invalid Razorpay webhook signature");

        return res.status(400).json({
            success: false,
            message: "Invalid webhook signature"
        });

    }

    try {

        const event =
            JSON.parse(req.body.toString("utf8"));

        console.log(
            "📦 Razorpay Webhook:",
            event.event
        );

        // -----------------------------------------
        // DUPLICATE EVENT PROTECTION
        // -----------------------------------------
        if (eventId) {

            const alreadyProcessed =
                await RazorpayWebhookEvent.findOne({
                    eventId
                });

            if (alreadyProcessed) {

                console.log(
                    "⚠️ Duplicate webhook ignored:",
                    eventId
                );

                return res.status(200).json({
                    success: true,
                    message: "Duplicate webhook ignored"
                });
            }
        }

        // -----------------------------------------
        // GET PAYMENT DATA
        // -----------------------------------------

        const payment =
            event.payload?.payment?.entity;

        const razorpayOrderId =
            payment?.order_id ||
            event.payload?.order?.entity?.id;



        if (eventId) {

            try {

                await RazorpayWebhookEvent.create({
                    eventId,
                    event: event.event,
                    razorpayOrderId,
                    razorpayPaymentId: payment?.id || null,
                    payload: event.payload,
                    processed: false
                });

                console.log(
                    "💾 Webhook event stored:",
                    eventId
                );

            } catch (error) {

                if (error.code === 11000) {

                    console.log(
                        "⚠️ Webhook event already stored:",
                        eventId
                    );

                } else {

                    throw error;

                }
            }
        }


        // -----------------------------------------
        // REFUND WEBHOOKS
        // -----------------------------------------

        if (
            event.event === "refund.processed" ||
            event.event === "refund.failed"
        ) {

            const refund =
                event.payload?.refund?.entity;

            if (!refund) {

                console.error(
                    "❌ Refund webhook payload missing refund entity"
                );

                return res.status(400).json({
                    success: false,
                    message: "Invalid refund webhook payload"
                });

            }

            const refundId =
                refund.id;

            const paymentId =
                refund.payment_id;

            const refundOrderId =
                refund.order_id;

            // -----------------------------------------
            // FIND LOCAL ORDER
            // -----------------------------------------

            let order = null;

            if (refundOrderId) {

                order =
                    await Order.findOne({
                        razorpayOrderId: refundOrderId
                    });

            }

            if (!order && paymentId) {

                order =
                    await Order.findOne({
                        razorpayPaymentId: paymentId
                    });

            }

            if (!order) {

                console.error(
                    "❌ Local order not found for refund:",
                    {
                        refundId,
                        paymentId,
                        refundOrderId
                    }
                );

                return res.status(200).json({
                    success: true,
                    message:
                        "Refund received, local order not found"
                });

            }

            // -----------------------------------------
            // EXTRA REFUND OWNERSHIP CHECK
            // -----------------------------------------

            if (
                paymentId &&
                order.razorpayPaymentId &&
                paymentId !== order.razorpayPaymentId
            ) {

                console.error(
                    "❌ Refund payment does not belong to order"
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "Refund payment does not belong to this order"
                });

            }

            // -----------------------------------------
            // REFUND PROCESSED
            // -----------------------------------------

            if (event.event === "refund.processed") {

                order.refundStatus =
                    "Completed";

                order.razorpayRefundId =
                    refundId ||
                    order.razorpayRefundId;

                order.refundedAt =
                    new Date();

                order.refundFailureReason =
                    null;

                // Full refund only in our current flow
                if (
                    Number(refund.amount) ===
                    Math.round(Number(order.total) * 100)
                ) {

                    order.paymentStatus =
                        "Refunded";

                }

                if (eventId) {

                    order.processedWebhookEvents.push(
                        eventId
                    );

                }

                await order.save();

                console.log(
                    "✅ Refund completed:",
                    order._id,
                    refundId
                );
            }

            // -----------------------------------------
            // REFUND FAILED
            // -----------------------------------------

            if (event.event === "refund.failed") {

                order.refundStatus =
                    "Failed";

                order.razorpayRefundId =
                    refundId ||
                    order.razorpayRefundId;

                order.refundFailureReason =
                    String(
                        refund?.notes?.reason ||
                        refund?.error_description ||
                        refund?.error_reason ||
                        "Razorpay refund failed"
                    ).slice(0, 250);

                if (eventId) {

                    order.processedWebhookEvents.push(
                        eventId
                    );

                }

                await order.save();

                console.error(
                    "❌ Refund failed:",
                    order._id,
                    refundId
                );
            }

            return res.status(200).json({

                success: true,

                message:
                    "Refund webhook processed successfully"

            });
        }

        // -----------------------------------------
        // ORDER ID NOT FOUND
        // -----------------------------------------

        if (!razorpayOrderId) {

            console.log(
                "⚠️ Webhook received without Razorpay Order ID"
            );

            return res.status(200).json({
                success: true,
                message: "Webhook received"
            });

        }

        // -----------------------------------------
        // PAYMENT CAPTURED
        // -----------------------------------------
        if (
            event.event === "payment.captured" ||
            event.event === "order.paid"
        ) {

            const order =
                await Order.findOne({
                    razorpayOrderId
                });

            if (!order) {

                console.log(
                    "ℹ️ Webhook stored; local order not created yet:",
                    razorpayOrderId
                );

                return res.status(200).json({
                    success: true,
                    message: "Webhook stored for reconciliation"
                });
            }

            // -------------------------------------
            // ALREADY PAID
            // -------------------------------------

            if (order.paymentStatus === "Paid") {

                console.log(
                    "✅ Order already marked Paid"
                );

                return res.status(200).json({
                    success: true,
                    message: "Order already paid"
                });

            }

            // -------------------------------------
            // UPDATE PAYMENT
            // -------------------------------------

            order.paymentStatus = "Paid";

            order.razorpayPaymentId =
                payment?.id || order.razorpayPaymentId;

            order.paymentVerifiedAt =
                new Date();

            if (eventId) {
                order.processedWebhookEvents.push(
                    eventId
                );
            }

            await order.save();

            console.log(
                "✅ Payment marked Paid:",
                order._id
            );
        }

        // -----------------------------------------
        // PAYMENT FAILED
        // -----------------------------------------

        if (event.event === "payment.failed") {

            const order =
                await Order.findOne({
                    razorpayOrderId
                });

            if (!order) {

                return res.status(200).json({
                    success: true,
                    message: "Order not found"
                });

            }

            if (
                order.paymentStatus !== "Paid"
            ) {

                order.paymentStatus = "Failed";

                if (eventId) {
                    order.processedWebhookEvents.push(eventId);
                }

                await order.save();



                console.log(
                    "❌ Payment marked Failed:",
                    order._id
                );

            }

        }

        // -----------------------------------------
        // SUCCESS RESPONSE
        // -----------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Webhook processed successfully"

        });

    } catch (error) {

        console.error(
            "❌ WEBHOOK ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Webhook processing failed"

        });

    }

};
