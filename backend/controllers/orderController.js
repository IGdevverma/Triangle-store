const sendEmail = require("../utils/sendEmail");
const Order = require("../models/Order");
const Product = require("../models/Product");
const orderPlaced = require("../templates/orderPlaced");



const orderPacked = require("../templates/orderPacked");
const orderShipped = require("../templates/orderShipped");
const orderDelivered = require("../templates/orderDelivered");
const orderCancelled = require("../templates/orderCancelled");

console.log("Order Template Function:", orderPlaced);
// Create Order
// Create Order
const createOrder = async (req, res) => {

    try {

        const items = [];

        // Products and prices always come from the database, never from the browser.
        for (const item of req.body.items || []) {

            const productId = item.productId || item._id || item.id;
            const product = await Product.findById(productId);

            if (!product) {

                return res.status(404).json({
                    success: false,
                    message: `${item.name} not found`
                });

            }

            const quantity = Number(item.quantity);

            if (!Number.isInteger(quantity) || quantity < 1) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid item quantity"
                });

            }

            if (product.stock < quantity) {

                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} ${product.name} left in stock`
                });

            }

            items.push({
                productId: product._id.toString(),
                name: product.name,
                image: product.image,
                price: product.price,
                quantity
            });

        }

        if (!items.length) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shipping = subtotal >= 1999 ? 0 : 99;
        const gst = Math.round(subtotal * 0.18);

        const order = await Order.create({
            ...req.body,
            user: req.user._id,
            items,
            total: subtotal + shipping + gst,
            trackingHistory: [{ status: "Processing", date: new Date() }]
        });

        for (const item of order.items) {

            await Product.findByIdAndUpdate(

                item.productId,

                {
                    $inc: {
                        stock: -item.quantity
                    }
                },

                { new: true }

            );
        }










        try {
            console.log("STEP 1");
            const html = orderPlaced(order);
            console.log("STEP 2");

            console.log(html.substring(0, 300));

            console.log("STEP 3");

            await sendEmail({

                to: order.email,

                subject: "🎉 Order Confirmed - Triangle Sports",

                html

            });


            console.log("STEP 4");
        } catch (mailError) {

            console.error("❌ Order email failed:", mailError);

        }

        // =============================
        // Response
        // =============================

        res.status(201).json({
            success: true,
            message: "Order Placed Successfully",
            order
        });

    } catch (error) {

        console.error("ORDER ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

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

    try {

        const order = await Order.findById(req.params.id);

        if (!order) {

            return res.status(404).json({

                success: false,
                message: "Order not found"

            });

        }

        const isAdmin = req.user.role === "admin";
        const isOwner = order.user?.toString() === req.user._id.toString();

        if (!isAdmin && (!isOwner || req.body.orderStatus !== "Cancelled")) {
            return res.status(403).json({ success: false, message: "Not allowed to update this order" });
        }

        // Update current status
        order.orderStatus = req.body.orderStatus;

        // Add tracking history
        order.trackingHistory.push({

            status: req.body.orderStatus,

            date: new Date()

        });

        await order.save();
        // Send email when order is packed
        if (order.orderStatus === "Packed") {

            try {

                await sendEmail({

                    to: order.email,

                    subject: "📦 Your Order Has Been Packed",

                    html: orderPacked(order)

                });

                console.log("✅ Packed email sent.");

            } catch (mailError) {

                console.error("❌ Packed email failed:", mailError);

            }

        }

        res.status(200).json({

            success: true,
            message: "Order status updated",
            order

        });

    } catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};
module.exports = {

    createOrder,

    getOrders,

    updateOrderStatus,
    getOrderById


};



