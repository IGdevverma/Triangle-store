const sendEmail = require("../utils/sendEmail");
const Order = require("../models/Order");
const Product = require("../models/Product");
// Create Order
// Create Order
const createOrder = async (req, res) => {

    try {

        console.log(req.body);


        // Check Stock Before Creating Order
        for (const item of req.body.items) {

            const product = await Product.findById(item._id);

            if (!product) {

                return res.status(404).json({
                    success: false,
                    message: `${item.name} not found`
                });

            }

            if (product.stock < item.quantity) {

                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} ${product.name} left in stock`
                });

            }

        }

        const order = await Order.create(req.body);

        for (const item of order.items) {

            console.log("Item ID:", item._id);
            console.log("Quantity:", item.quantity);

            const updatedProduct = await Product.findByIdAndUpdate(

                item._id,

                {
                    $inc: {
                        stock: -item.quantity
                    }
                },

                { new: true }

            );

            console.log("Updated Product:", updatedProduct);

        }

        console.log("Customer Email:", order.email);

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