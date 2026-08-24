const sendEmail = require("../utils/sendEmail");

const orderPlaced = require("../emails/templates/orderPlaced");
const orderProcessing = require("../emails/templates/orderProcessing");
const orderPacked = require("../emails/templates/orderPacked");
const orderShipped = require("../emails/templates/orderShipped");
const orderDelivered = require("../emails/templates/orderDelivered");
const orderCancelled = require("../emails/templates/orderCancelled");


class EmailService {

    // ==========================================
    // ORDER PLACED
    // ==========================================

    static async sendOrderPlaced(order) {

        return sendEmail({

            to: order.email,

            subject:
                "🎉 Order Confirmed - Triangle Sports",

            html:
                orderPlaced(order)

        });

    }


    // ==========================================
    // ORDER PROCESSING
    // ==========================================

    static async sendOrderProcessing(order) {

        return sendEmail({

            to: order.email,

            subject:
                "⚙️ Your Order Is Being Processed - Triangle Sports",

            html:
                orderProcessing(order)

        });

    }


    // ==========================================
    // ORDER PACKED
    // ==========================================

    static async sendOrderPacked(order) {

        return sendEmail({

            to: order.email,

            subject:
                "📦 Your Order Has Been Packed - Triangle Sports",

            html:
                orderPacked(order)

        });

    }


    // ==========================================
    // ORDER SHIPPED
    // ==========================================

    static async sendOrderShipped(order) {

        return sendEmail({

            to: order.email,

            subject:
                "🚚 Your Order Has Been Shipped - Triangle Sports",

            html:
                orderShipped(order)

        });

    }


    // ==========================================
    // ORDER DELIVERED
    // ==========================================

    static async sendOrderDelivered(order) {

        return sendEmail({

            to: order.email,

            subject:
                "✅ Your Order Has Been Delivered - Triangle Sports",

            html:
                orderDelivered(order)

        });

    }


    // ==========================================
    // ORDER CANCELLED
    // ==========================================

    static async sendOrderCancelled(order) {

        return sendEmail({

            to: order.email,

            subject:
                "❌ Order Cancelled - Triangle Sports",

            html:
                orderCancelled(order)

        });

    }

}


module.exports = EmailService;