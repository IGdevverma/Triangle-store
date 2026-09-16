const sendEmail = require("../utils/sendEmail");
const passwordReset = require("../emails/templates/passwordReset");
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

    static async sendAdminNewOrder(order) {

        const adminEmail = process.env.ADMIN_EMAIL;

        console.log("📧 ADMIN_EMAIL:", adminEmail);

        if (!adminEmail) {
            throw new Error("ADMIN_EMAIL is missing in .env");
        }

        return sendEmail({

            to: adminEmail,

            subject:
                "🛒 New Order Received - Triangle Sports",

            html:
                orderPlaced(order)

        });

    }


    // ==========================================
    // PASSWORD RESET
    // ==========================================

    static async sendPasswordReset(email, resetUrl) {

        return sendEmail({

            to: email,

            subject:
                "🔐 Reset Your Triangle Sports Password",

            html:
                passwordReset(resetUrl)

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