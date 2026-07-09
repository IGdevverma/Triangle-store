const sendEmail = require("../utils/sendEmail");
const Order = require("../models/Order");

// Create Order
// Create Order
const createOrder = async (req, res) => {

    try {

        console.log(req.body);

        const order = await Order.create(req.body);

        console.log("Customer Email:", order.email);
        console.log("Customer Name:", order.customerName);

        // Send email (order save hone ke baad)
        try {

            await sendEmail({
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
            });

            console.log("✅ Order confirmation email sent to:", order.email);

        } catch (err) {

            console.error("❌ Email failed:", err.message);

        }

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

        const orders = await Order.find().sort({

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

// Update Order Status

const updateOrderStatus = async (req, res) => {

    try {

        const order = await Order.findByIdAndUpdate(

            req.params.id,

            {
                orderStatus: req.body.orderStatus
            },

            {
                new: true
            }

        );

        if (!order) {

            return res.status(404).json({

                success: false,
                message: "Order not found"

            });

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

    updateOrderStatus

};