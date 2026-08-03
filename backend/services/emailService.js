const sendEmail = require("../utils/sendEmail");

const orderPlaced = require("../emails/templates/orderPlaced");
const orderPacked = require("../emails/templates/orderPacked");
const orderShipped = require("../emails/templates/orderShipped");
const orderDelivered = require("../emails/templates/orderDelivered");
const orderCancelled = require("../emails/templates/orderCancelled");

class EmailService {

    static async sendOrderPlaced(order) {

        return sendEmail({
            to: order.email,
            subject: "🎉 Order Confirmed - Triangle Sports",
            html: orderPlaced(order)
        });

    }

    static async sendOrderPacked(order) {

        return sendEmail({
            to: order.email,
            subject: "📦 Your Order Has Been Packed",
            html: orderPacked(order)
        });

    }

    static async sendOrderShipped(order) {

        return sendEmail({
            to: order.email,
            subject: "🚚 Your Order Has Been Shipped",
            html: orderShipped(order)
        });

    }

    static async sendOrderDelivered(order) {

        return sendEmail({
            to: order.email,
            subject: "✅ Order Delivered",
            html: orderDelivered(order)
        });

    }

    static async sendOrderCancelled(order) {

        return sendEmail({
            to: order.email,
            subject: "❌ Order Cancelled",
            html: orderCancelled(order)
        });

    }

}

module.exports = EmailService;