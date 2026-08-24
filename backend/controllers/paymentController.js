const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const razorpay = new Razorpay({

    key_id: process.env.RAZORPAY_KEY_ID,

    key_secret: process.env.RAZORPAY_KEY_SECRET

});

exports.createOrder = async (req, res) => {

    try {

        const { amount } = req.body;

        const options = {

            amount: amount * 100, // paise

            currency: "INR",

            receipt: `receipt_${Date.now()}`

        };

        const order = await razorpay.orders.create(options);


        res.status(200).json({

            success: true,

            order,

            key: process.env.RAZORPAY_KEY_ID

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // ==========================================
        // 1. Validate request
        // ==========================================

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Incomplete payment details"
            });
        }

        // ==========================================
        // 2. Verify Razorpay signature
        // ==========================================

        const body =
            razorpay_order_id +
            "|" +
            razorpay_payment_id;

        const expectedSignature = crypto
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
                message: "Invalid payment signature"
            });
        }

        // ==========================================
        // 3. Fetch actual payment from Razorpay
        // ==========================================

        const payment =
            await razorpay.payments.fetch(
                razorpay_payment_id
            );

        // ==========================================
        // 4. Verify payment belongs to order
        // ==========================================

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

        // ==========================================
        // 5. Payment must be captured
        // ==========================================

        if (
            payment.status !== "captured"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Payment is not captured. Current status: ${payment.status}`
            });
        }

        // ==========================================
        // 6. Success
        // ==========================================

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",

            razorpayOrderId:
                razorpay_order_id,

            razorpayPaymentId:
                razorpay_payment_id,

            paymentStatus: "Paid"
        });

    } catch (error) {

        console.error(
            "VERIFY PAYMENT ERROR:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to verify payment"
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
                await Order.findOne({
                    razorpayEventId: eventId
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

                console.error(
                    "❌ Local order not found:",
                    razorpayOrderId
                );

                return res.status(200).json({
                    success: true,
                    message: "Webhook received, order not found"
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
                order.razorpayEventId = eventId;
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
                    order.razorpayEventId =
                        eventId;
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
