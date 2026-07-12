const sendEmail = require("../utils/sendEmail");
const Order = require("../models/Order");
const Product = require("../models/Product");
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

        res.status(201).json({
            success: true,
            message: "Order Placed Successfully",
            order
        });







        sendEmail({
            to: order.email,
            subject: "🎉 Order Confirmed - Triangle Sports",
            html: `
        <h2>Thank you for shopping with Triangle Sports!</h2>

        <p>Hello <b>${order.customerName}</b>,</p>

        <p>Your order has been placed successfully.</p>

        <hr>

        <p><b>Order ID:</b> ${order._id}</p>

        <p><b>Total:</b> ₹${order.total}</p>

        <p><b>Payment:</b> ${order.paymentMethod}</p>

        <p><b>Status:</b> ${order.orderStatus}</p>

        <br>

        <p>We'll notify you once your order is shipped.</p>

        <h3>Triangle Sports ❤️</h3>
    `
        })
            .then(() => {
                console.log("✅ Order confirmation email sent to:", order.email);
            })
            .catch(err => {
                console.error("❌ Email failed:", err.message);
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
