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
const {
    createShiprocketOrder,
    assignShiprocketAwb,
    generateShiprocketPickup,
    trackShiprocketAwb
} = require("../services/shiprocketService");
const jwt = require("jsonwebtoken");



// ============================================================
// RESOLVE ORDER ACTOR
// ============================================================
//
// Supports:
// 1. Logged-in users
// 2. OTP-verified guests
//
// Guest must provide:
// X-Guest-Verification-Token
//
// ============================================================

const resolveOrderActor = (req) => {

    // ========================================================
    // LOGGED-IN USER
    // ========================================================

    if (req.user) {

        return {
            type: "user",

            userId:
                req.user._id,

            verifiedPhone:
                req.user.phone || null
        };
    }


    // ========================================================
    // GUEST USER
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
    // VERIFY SERVER-SIGNED TOKEN
    // ========================================================

    let decoded;

    try {

        decoded =
            jwt.verify(
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
    // VALIDATE TOKEN
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
    // RETURN GUEST ACTOR
    // ========================================================

    return {

        type: "guest",

        userId: null,

        verifiedPhone:
            decoded.phone
    };
};


// ============================================================
// CREATE ORDER
// ============================================================

const createOrder = async (req, res) => {

    const session =
        await mongoose.startSession();

    try {

        // ======================================================
        // 1. RESOLVE USER / GUEST
        // ======================================================

        const orderActor =
            resolveOrderActor(req);


        console.log(
            "CREATE ORDER REQUEST:",
            {
                type:
                    orderActor.type,

                userId:
                    orderActor.userId || null,

                verifiedPhone:
                    orderActor.verifiedPhone || null
            }
        );


        // ======================================================
        // START TRANSACTION
        // ======================================================

        session.startTransaction();


        // ======================================================
        // 2. GET CUSTOMER DATA
        // ======================================================

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


        // ======================================================
        // 3. BASIC VALIDATION
        // ======================================================

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


        // ======================================================
        // 4. NORMALIZE PHONE
        // ======================================================

        const normalizedCustomerPhone =
            String(phone)
                .replace(/\D/g, "")
                .replace(/^91/, "")
                .slice(-10);


        if (
            normalizedCustomerPhone.length !== 10
        ) {

            await session.abortTransaction();

            return res.status(400).json({

                success: false,

                message:
                    "Invalid mobile number"
            });
        }


        // ======================================================
        // 5. GUEST PHONE MUST MATCH VERIFIED PHONE
        // ======================================================

        if (
            orderActor.type === "guest"
        ) {

            const verifiedPhoneDigits =
                String(
                    orderActor.verifiedPhone
                )
                    .replace(/\D/g, "")
                    .replace(/^91/, "")
                    .slice(-10);


            if (
                verifiedPhoneDigits !==
                normalizedCustomerPhone
            ) {

                await session.abortTransaction();

                return res.status(401).json({

                    success: false,

                    message:
                        "Mobile number does not match the verified phone number"
                });
            }
        }


        // ======================================================
        // 6. PAYMENT METHOD VALIDATION
        // ======================================================

        if (
            paymentMethod !== "UPI" &&
            paymentMethod !== "CARD" &&
            paymentMethod !== "NETBANKING" &&
            paymentMethod !== "WALLET" &&
            paymentMethod !== "COD"
        ) {

            await session.abortTransaction();

            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment method"
            });
        }
        // ======================================================
        // 7-12. PAYMENT VERIFICATION
        // ======================================================

        let verifiedPayment = null;

        // ======================================================
        // COD
        // ======================================================

        if (paymentMethod === "COD") {

            console.log(
                "COD ORDER - Razorpay verification skipped"
            );

        } else {

            // ======================================================
            // 7. RAZORPAY PAYMENT DATA
            // ======================================================

            if (
                !razorpayOrderId ||
                !razorpayPaymentId
            ) {

                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message: "Payment information is missing"
                });
            }

            // ======================================================
            // 8. VERIFY SERVER-SIDE PAYMENT RECORD
            // ======================================================

            if (
                orderActor.type === "user"
            ) {

                verifiedPayment =
                    await PaymentVerification.findOne({

                        razorpayOrderId,

                        razorpayPaymentId,

                        user:
                            orderActor.userId

                    }).session(session);

            } else {

                verifiedPayment =
                    await PaymentVerification.findOne({

                        razorpayOrderId,

                        razorpayPaymentId,

                        user: null,

                        verifiedPhone:
                            orderActor.verifiedPhone

                    }).session(session);
            }

            // ======================================================
            // PAYMENT VERIFICATION NOT FOUND
            // ======================================================

            if (!verifiedPayment) {

                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message: "Payment has not been verified"
                });
            }

            // ======================================================
            // 9. VERIFY PAYMENT PHONE
            // ======================================================

            if (
                orderActor.type === "guest"
            ) {

                const paymentPhone =
                    String(
                        verifiedPayment.verifiedPhone || ""
                    )
                        .replace(/\D/g, "")
                        .replace(/^91/, "")
                        .slice(-10);

                if (
                    paymentPhone !==
                    normalizedCustomerPhone
                ) {

                    await session.abortTransaction();

                    return res.status(401).json({
                        success: false,
                        message:
                            "Payment verification phone does not match order phone"
                    });
                }
            }

            // ======================================================
            // 10. PAYMENT VERIFICATION EXPIRY
            // ======================================================

            if (
                !verifiedPayment.expiresAt ||
                new Date() >
                verifiedPayment.expiresAt
            ) {

                await PaymentVerification.deleteOne({
                    _id:
                        verifiedPayment._id
                }).session(session);

                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message:
                        "Payment verification has expired. Please try again."
                });
            }

            // ======================================================
            // 11. PREVENT PAYMENT REUSE
            // ======================================================

            const existingPaidOrder =
                await Order.findOne({

                    razorpayOrderId,

                    razorpayPaymentId,

                    paymentStatus: "Paid"

                }).session(session);

            if (existingPaidOrder) {

                await session.abortTransaction();

                return res.status(409).json({
                    success: false,
                    message:
                        "This payment has already been used for an order"
                });
            }

            // ======================================================
            // 12. PREVENT DUPLICATE RAZORPAY ORDER
            // ======================================================

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
                    order:
                        existingOrder
                });
            }
        }

        // ======================================================
        // 13. GET PRODUCTS FROM DATABASE
        // ======================================================

        const items = [];


        for (
            const item of
            req.body.items || []
        ) {

            const productId =
                item.productId ||
                item._id ||
                item.id;


            if (!productId) {

                await session.abortTransaction();

                return res.status(400).json({

                    success: false,

                    message:
                        "Product ID is missing"
                });
            }


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


            // --------------------------------------------------
            // QUANTITY
            // --------------------------------------------------

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


            // ==================================================
            // PACK INFORMATION
            // ==================================================

            const selectedPack =
                item.selectedPack ||
                "single";


            let packQuantity = 1;

            let packPrice =
                Number(
                    product.price || 0
                );


            // --------------------------------------------------
            // SINGLE
            // --------------------------------------------------

            if (
                selectedPack === "single"
            ) {

                packQuantity = 1;

                packPrice =
                    Number(
                        product.price || 0
                    );
            }


            // --------------------------------------------------
            // PACK
            // --------------------------------------------------

            else {

                const pack =
                    product.packs?.find(
                        p =>
                            p.id ===
                            selectedPack
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

                await session.abortTransaction();

                return res.status(400).json({

                    success: false,

                    message:
                        `Only ${product.stock} pieces of ${product.name} are available`
                });
            }


            // ==================================================
            // SAVE VERIFIED ITEM
            // ==================================================

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

                selectedPack,

                selectedCombination:
                    item.selectedCombination || "",

                totalUnits
            });
        }


        // ======================================================
        // 14. CART EMPTY CHECK
        // ======================================================

        if (
            !items.length
        ) {

            await session.abortTransaction();

            return res.status(400).json({

                success: false,

                message:
                    "Cart is empty"
            });
        }


        // ======================================================
        // 15. SERVER-SIDE PRICING
        // ======================================================

        let pricing;


        try {

            pricing =
                calculatePricing(

                    items.map(item => ({

                        packPrice:
                            item.price,

                        quantity:
                            item.quantity

                    })),

                    couponCode
                );

        } catch (error) {

            await session.abortTransaction();

            return res.status(400).json({

                success: false,

                message:
                    error.message
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


        // ======================================================
        // 16. VERIFY PAYMENT AMOUNT
        // ======================================================

        // ======================================================
        // 16. VERIFY PAYMENT AMOUNT
        // ======================================================

        // COD orders do not have a Razorpay payment record.
        // Therefore payment amount verification is only required
        // for online payments.

        if (paymentMethod !== "COD") {

            const expectedPaymentAmount =
                Math.round(
                    Number(total) * 100
                );

            if (
                Number(
                    verifiedPayment.amount
                ) !==
                expectedPaymentAmount ||

                verifiedPayment.currency !==
                "INR"
            ) {

                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message:
                        "Payment amount does not match order total"
                });
            }
        }


        // ======================================================
        // 17. ATOMIC STOCK DEDUCTION
        // ======================================================

        for (
            const item of items
        ) {

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
                        returnDocument:
                            "after",

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


        // ======================================================
        // 18. CREATE ORDER
        // ======================================================

        const [order] =
            await Order.create(

                [
                    {

                        // --------------------------------------
                        // USER
                        // --------------------------------------
                        //
                        // Logged-in user -> ObjectId
                        // Guest -> null
                        //
                        user:
                            orderActor.userId || null,


                        // --------------------------------------
                        // CUSTOMER DETAILS
                        // --------------------------------------

                        customerName,

                        email,

                        phone:
                            normalizedCustomerPhone,

                        address,

                        city,

                        state,

                        pincode,


                        // --------------------------------------
                        // PAYMENT
                        // --------------------------------------

                        paymentMethod,

                        paymentStatus:
                            paymentMethod === "COD"
                                ? "Pending"
                                : "Paid",

                        ...(paymentMethod !== "COD" && {
                            razorpayOrderId
                        }),

                        razorpayPaymentId:
                            paymentMethod === "COD"
                                ? null
                                : razorpayPaymentId,

                        paymentVerifiedAt:
                            paymentMethod === "COD"
                                ? null
                                : new Date(),


                        // --------------------------------------
                        // ITEMS
                        // --------------------------------------

                        items,


                        // --------------------------------------
                        // PRICING
                        // --------------------------------------

                        subtotal,

                        discountAmount,

                        shipping,

                        gst,

                        couponCode,

                        total,


                        // --------------------------------------
                        // ORDER STATUS
                        // --------------------------------------

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


        // ======================================================
        // 19. CONSUME PAYMENT VERIFICATION
        // ======================================================

        if (paymentMethod !== "COD") {

            let consumedPayment;


            if (
                orderActor.type === "user"
            ) {

                consumedPayment =
                    await PaymentVerification.findOneAndDelete(

                        {

                            _id:
                                verifiedPayment._id,

                            user:
                                orderActor.userId,

                            razorpayOrderId,

                            razorpayPaymentId

                        },

                        {
                            session
                        }
                    );

            } else {

                consumedPayment =
                    await PaymentVerification.findOneAndDelete(

                        {

                            _id:
                                verifiedPayment._id,

                            user: null,

                            verifiedPhone:
                                orderActor.verifiedPhone,

                            razorpayOrderId,

                            razorpayPaymentId

                        },

                        {
                            session
                        }
                    );
            }


            // ======================================================
            // PAYMENT CONSUMPTION FAILED
            // ======================================================

            if (!consumedPayment) {

                await session.abortTransaction();

                return res.status(409).json({

                    success: false,

                    message:
                        "Payment verification could not be consumed"
                });
            }

        } // ✅ COD wrapper close



        // ======================================================
        // 20. COMMIT TRANSACTION
        // ======================================================

        await session.commitTransaction();




        // ======================================================
        // 21. RECONCILE RAZORPAY WEBHOOK EVENTS
        // ======================================================

        if (paymentMethod !== "COD") {

            try {

                const reconciliationResult =
                    await RazorpayWebhookEvent.updateMany(

                        {
                            razorpayOrderId:
                                razorpayOrderId,

                            processed:
                                false
                        },

                        {
                            $set: {

                                processed:
                                    true,

                                processedAt:
                                    new Date()
                            }
                        }
                    );


                if (
                    reconciliationResult.modifiedCount >
                    0
                ) {

                    console.log(
                        "Razorpay webhook event(s) reconciled:",
                        razorpayOrderId,
                        reconciliationResult.modifiedCount
                    );
                }

            } catch (
            webhookReconciliationError
            ) {

                console.error(
                    "Webhook reconciliation failed:",
                    webhookReconciliationError.message
                );
            }

        }


        // ======================================================
        // 22. CUSTOMER ORDER EMAIL
        // ======================================================

        try {

            await EmailService
                .sendOrderPlaced(order);


            console.log(
                "Customer order confirmation email sent."
            );

        } catch (
        customerMailError
        ) {

            console.error(
                "Customer order confirmation email failed:",
                customerMailError
            );
        }


        // ======================================================
        // 23. ADMIN ORDER EMAIL
        // ======================================================

        try {

            await EmailService
                .sendAdminNewOrder(order);


            console.log(
                "Admin order notification email sent."
            );

        } catch (
        adminMailError
        ) {

            console.error(
                "Admin order notification email failed:",
                adminMailError
            );
        }


        // ======================================================
        // 24. FINAL RESPONSE
        // ======================================================

        return res.status(201).json({

            success: true,

            message:
                "Order Placed Successfully",

            order
        });


    } catch (error) {

        // ------------------------------------------------------
        // ABORT ONLY IF TRANSACTION IS ACTIVE
        // ------------------------------------------------------

        if (
            session.inTransaction()
        ) {

            await session.abortTransaction();
        }


        console.error(
            "ORDER ERROR:",
            error
        );


        return res.status(
            error.statusCode || 500
        ).json({

            success: false,

            message:
                error.statusCode
                    ? error.message
                    : "Unable to create order"
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


// ==========================================================
// CREATE SHIPROCKET SHIPMENT
// ==========================================================

const createShipment = async (req, res) => {

    try {

        // ==========================================
        // 1. VALIDATE ORDER ID
        // ==========================================

        if (!mongoose.isValidObjectId(req.params.id)) {

            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });

        }

        // ==========================================
        // 2. GET ORDER
        // ==========================================

        const order = await Order.findById(req.params.id);

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        // ==========================================
        // 3. PAYMENT CHECK
        // ==========================================

        if (
            order.paymentStatus !== "Paid" &&
            order.paymentMethod !== "COD"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Shipment can only be created for a paid order"
            });
        }

        // ==========================================
        // 4. PREVENT DUPLICATE SHIPMENT
        // ==========================================

        if (order.shiprocketOrderId) {

            return res.status(409).json({
                success: false,
                message:
                    "Shiprocket shipment has already been created for this order",
                order
            });

        }

        // ==========================================
        // 5. CHECK ORDER ITEMS
        // ==========================================

        if (
            !Array.isArray(order.items) ||
            order.items.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Order has no items"
            });

        }

        // ==========================================
        // 6. CHECK PICKUP LOCATION
        // ==========================================

        const pickupLocation =
            process.env.SHIPROCKET_PICKUP_LOCATION;

        if (!pickupLocation) {

            return res.status(500).json({
                success: false,
                message:
                    "Shiprocket pickup location is not configured"
            });

        }

        // ==========================================
        // 7. BUILD SHIPPING DATA
        // ==========================================

        let totalWeight = 0;

        let packageLength = 0;
        let packageBreadth = 0;
        let packageHeight = 0;

        const shiprocketItems = [];

        for (const item of order.items) {

            const product =
                await Product.findById(item.productId);

            if (!product) {

                return res.status(404).json({
                    success: false,
                    message:
                        `Product "${item.name}" no longer exists`
                });

            }

            const quantity =
                Number(item.quantity || 1);

            const weight =
                Number(product.weight || 0);

            const length =
                Number(product.length || 0);

            const breadth =
                Number(product.breadth || 0);

            const height =
                Number(product.height || 0);

            // ==========================================
            // SHIPPING DETAILS REQUIRED
            // ==========================================

            if (
                weight <= 0 ||
                length <= 0 ||
                breadth <= 0 ||
                height <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        `Shipping details are missing for "${product.name}". Please update the product first.`
                });

            }

            // ==========================================
            // TOTAL WEIGHT
            // ==========================================

            totalWeight +=
                weight * quantity;

            // ==========================================
            // PACKAGE DIMENSIONS
            // ==========================================

            packageLength =
                Math.max(
                    packageLength,
                    length
                );

            packageBreadth =
                Math.max(
                    packageBreadth,
                    breadth
                );

            packageHeight =
                Math.max(
                    packageHeight,
                    height
                );

            // ==========================================
            // SHIPROCKET ITEM
            // ==========================================

            shiprocketItems.push({

                name:
                    item.name,

                sku:
                    product.sku ||
                    item.productId,

                units:
                    quantity,

                selling_price:
                    Number(item.price || 0),

                discount:
                    0,

                tax:
                    Number(order.gst || 0),

                hsn:
                    ""

            });

        }

        // ==========================================
        // 8. FINAL WEIGHT CHECK
        // ==========================================

        if (totalWeight <= 0) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid shipment weight"
            });

        }

        // ==========================================
        // 9. CREATE SHIPROCKET PAYLOAD
        // ==========================================

        const shiprocketPayload = {

            order_id:
                String(order._id),

            order_date:
                new Date(order.createdAt)
                    .toISOString(),

            pickup_location:
                pickupLocation,

            channel_id:
                process.env.SHIPROCKET_CHANNEL_ID || "",

            comment:
                `Triangle Sports Order ${order._id}`,

            billing_customer_name:
                order.customerName,

            billing_last_name:
                "",

            billing_address:
                order.address,

            billing_address_2:
                "",

            billing_city:
                order.city,

            billing_pincode:
                order.pincode,

            billing_state:
                order.state,

            billing_country:
                "India",

            billing_email:
                order.email,

            billing_phone:
                order.phone,

            shipping_is_billing:
                true,

            shipping_customer_name:
                order.customerName,

            shipping_last_name:
                "",

            shipping_address:
                order.address,

            shipping_address_2:
                "",

            shipping_city:
                order.city,

            shipping_pincode:
                order.pincode,

            shipping_country:
                "India",

            shipping_state:
                order.state,

            shipping_email:
                order.email,

            shipping_phone:
                order.phone,

            order_items:
                shiprocketItems,

            payment_method:
                order.paymentMethod === "COD"
                    ? "COD"
                    : "Prepaid",

            shipping_charges:
                Number(order.shipping || 0),

            giftwrap_charges:
                0,

            transaction_charges:
                0,

            total_discount:
                Number(
                    order.discountAmount || 0
                ),

            sub_total:
                Number(order.subtotal || 0),

            length:
                packageLength,

            breadth:
                packageBreadth,

            height:
                packageHeight,

            weight:
                Number(
                    totalWeight.toFixed(3)
                )
        };

        // ==========================================
        // 10. CREATE SHIPROCKET ORDER
        // ==========================================

        const shiprocketResponse =
            await createShiprocketOrder(
                shiprocketPayload
            );

        console.log(
            "SHIPROCKET CREATE RESPONSE:",
            shiprocketResponse
        );

        const shiprocketOrderId =
            shiprocketResponse?.order_id;

        const shiprocketShipmentId =
            shiprocketResponse?.shipment_id;

        if (!shiprocketOrderId) {

            return res.status(502).json({
                success: false,
                message:
                    "Shiprocket did not return an order ID"
            });

        }

        // ==========================================
        // 11. SAVE SHIPROCKET DETAILS
        // ==========================================

        order.shiprocketOrderId =
            String(shiprocketOrderId);

        order.shiprocketShipmentId =
            shiprocketShipmentId
                ? String(shiprocketShipmentId)
                : null;

        order.shiprocketStatus =
            shiprocketResponse?.status
                ? String(
                    shiprocketResponse.status
                )
                : "Created";

        order.shiprocketCreatedAt =
            new Date();

        await order.save({
            validateModifiedOnly: true
        });

        // ==========================================
        // 12. RESPONSE
        // ==========================================

        return res.status(201).json({

            success: true,

            message:
                "Shiprocket shipment created successfully",

            shiprocket: {

                orderId:
                    order.shiprocketOrderId,

                shipmentId:
                    order.shiprocketShipmentId,

                status:
                    order.shiprocketStatus

            },

            order

        });

    } catch (error) {

        console.error(
            "CREATE SHIPROCKET SHIPMENT ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to create Shiprocket shipment"

        });

    }

};




// ==========================================================
// ASSIGN SHIPROCKET AWB
// ==========================================================

const assignAwb = async (req, res) => {

    try {

        // ==========================================
        // 1. VALIDATE ORDER ID
        // ==========================================

        if (!mongoose.isValidObjectId(req.params.id)) {

            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });

        }

        // ==========================================
        // 2. GET ORDER
        // ==========================================

        const order =
            await Order.findById(req.params.id);

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        // ==========================================
        // 3. CHECK SHIPROCKET SHIPMENT
        // ==========================================

        if (!order.shiprocketShipmentId) {

            return res.status(400).json({
                success: false,
                message:
                    "Shiprocket shipment has not been created yet"
            });

        }

        // ==========================================
        // 4. PREVENT DUPLICATE AWB
        // ==========================================

        if (order.shiprocketAwbCode) {

            return res.status(409).json({
                success: false,
                message:
                    "AWB has already been assigned",
                awbCode:
                    order.shiprocketAwbCode,
                courier:
                    order.shiprocketCourierName
            });

        }

        // ==========================================
        // 5. ASSIGN AWB
        // ==========================================

        const response =
            await assignShiprocketAwb(
                order.shiprocketShipmentId
            );

        console.log(
            "SHIPROCKET AWB RESPONSE:",
            response
        );

        // ==========================================
        // 6. EXTRACT AWB DATA
        // ==========================================

        const awbData =
            response?.response?.data ||
            response?.data ||
            response;

        const awbCode =
            awbData?.awb_code ||
            awbData?.awb ||
            null;

        const courierName =
            awbData?.courier_name ||
            awbData?.courier ||
            null;

        // ==========================================
        // 7. VALIDATE RESPONSE
        // ==========================================

        if (!awbCode) {

            return res.status(502).json({
                success: false,
                message:
                    "Shiprocket did not return an AWB code",
                shiprocket:
                    response
            });

        }

        // ==========================================
        // 8. SAVE AWB DETAILS
        // ==========================================

        order.shiprocketAwbCode =
            String(awbCode);

        order.shiprocketCourierName =
            courierName
                ? String(courierName)
                : null;

        order.shiprocketStatus =
            "AWB Assigned";

        await order.save({
            validateModifiedOnly: true
        });

        // ==========================================
        // 9. RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Shiprocket AWB assigned successfully",

            shiprocket: {

                orderId:
                    order.shiprocketOrderId,

                shipmentId:
                    order.shiprocketShipmentId,

                awbCode:
                    order.shiprocketAwbCode,

                courierName:
                    order.shiprocketCourierName,

                status:
                    order.shiprocketStatus

            },

            order

        });

    } catch (error) {

        console.error(
            "ASSIGN SHIPROCKET AWB ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to assign Shiprocket AWB"

        });

    }

};


// ==========================================================
// GENERATE SHIPROCKET PICKUP
// ==========================================================

const generatePickup = async (req, res) => {

    try {

        // ==========================================
        // 1. VALIDATE ORDER ID
        // ==========================================

        if (!mongoose.isValidObjectId(req.params.id)) {

            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });

        }

        // ==========================================
        // 2. GET ORDER
        // ==========================================

        const order =
            await Order.findById(req.params.id);

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        // ==========================================
        // 3. CHECK SHIPROCKET SHIPMENT
        // ==========================================

        if (!order.shiprocketShipmentId) {

            return res.status(400).json({
                success: false,
                message:
                    "Shiprocket shipment has not been created yet"
            });

        }

        // ==========================================
        // 4. CHECK AWB
        // ==========================================

        if (!order.shiprocketAwbCode) {

            return res.status(400).json({
                success: false,
                message:
                    "AWB must be assigned before generating pickup"
            });

        }

        // ==========================================
        // 5. GENERATE PICKUP
        // ==========================================

        const response =
            await generateShiprocketPickup(
                order.shiprocketShipmentId
            );

        console.log(
            "SHIPROCKET PICKUP RESPONSE:",
            response
        );

        // ==========================================
        // 6. SAVE STATUS
        // ==========================================

        order.shiprocketStatus =
            "Pickup Requested";

        await order.save({
            validateModifiedOnly: true
        });

        // ==========================================
        // 7. RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Shiprocket pickup requested successfully",

            shiprocket: {

                orderId:
                    order.shiprocketOrderId,

                shipmentId:
                    order.shiprocketShipmentId,

                awbCode:
                    order.shiprocketAwbCode,

                courierName:
                    order.shiprocketCourierName,

                status:
                    order.shiprocketStatus,

                pickupResponse:
                    response

            },

            order

        });

    } catch (error) {

        console.error(
            "GENERATE SHIPROCKET PICKUP ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to generate Shiprocket pickup"

        });

    }

};


const trackShipment = async (req, res) => {
    try {
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

        if (!order.shiprocketAwbCode) {
            return res.status(400).json({
                success: false,
                message: "AWB has not been assigned yet"
            });
        }

        const response = await trackShiprocketAwb(
            order.shiprocketAwbCode
        );

        console.log(
            "SHIPROCKET TRACKING RESPONSE:",
            response
        );

        return res.status(200).json({
            success: true,
            message: "Shipment tracking fetched successfully",
            tracking: response,
            order
        });

    } catch (error) {

        console.error(
            "TRACK SHIPMENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch shipment tracking"
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

    createShipment,

    assignAwb,
    generatePickup,

    updateOrderStatus,
    trackShipment,
    getOrderById

};



