const sendEmail = require("../utils/sendEmail");

const passwordReset = require("../emails/templates/passwordReset");
const orderPlaced = require("../emails/templates/orderPlaced");
const adminNewOrder = require("../emails/templates/adminNewOrder");
const orderProcessing = require("../emails/templates/orderProcessing");
const orderPacked = require("../emails/templates/orderPacked");
const orderShipped = require("../emails/templates/orderShipped");
const orderDelivered = require("../emails/templates/orderDelivered");
const orderCancelled = require("../emails/templates/orderCancelled");

class EmailService {

    // =========================================================
    // PRIVATE / INTERNAL EMAIL SENDER
    // =========================================================

    static async send({
        to,
        subject,
        html,
        type
    }) {

        if (!to) {
            throw new Error(
                `Cannot send ${type || "email"}: recipient email is missing`
            );
        }

        if (!subject) {
            throw new Error(
                `Cannot send ${type || "email"}: subject is missing`
            );
        }

        if (!html) {
            throw new Error(
                `Cannot send ${type || "email"}: email content is missing`
            );
        }

        const email = String(to)
            .trim()
            .toLowerCase();

        try {

            const result = await sendEmail({
                to: email,
                subject,
                html
            });

            console.log(
                `✅ ${type || "Email"} sent successfully → ${email}`
            );

            return result;

        } catch (error) {

            console.error(
                `❌ ${type || "Email"} failed → ${email}`
            );

            console.error(
                "Email error:",
                error.message
            );

            throw error;
        }
    }


    // =========================================================
    // ORDER PLACED
    // =========================================================

    static async sendOrderPlaced(order) {

        return this.send({
            to: order.email,
            subject:
                "🎉 Order Confirmed | Triangle Sports",
            html:
                orderPlaced(order),
            type:
                "Order Confirmation Email"
        });
    }


    // =========================================================
    // ADMIN NEW ORDER
    // =========================================================

    static async sendAdminNewOrder(order) {

        const adminEmail = process.env.ADMIN_EMAIL;

        if (!adminEmail) {
            throw new Error(
                "ADMIN_EMAIL is missing in environment variables"
            );
        }

        return this.send({
            to: adminEmail,
            subject: "🛒 New Order Received | Triangle Sports",
            html: adminNewOrder(order),
            type: "Admin New Order Email"
        });
    }


    // =========================================================
    // PASSWORD RESET
    // =========================================================

    static async sendPasswordReset(
        email,
        resetUrl
    ) {

        return this.send({
            to: email,
            subject:
                "🔐 Reset Your Password | Triangle Sports",
            html:
                passwordReset(resetUrl),
            type:
                "Password Reset Email"
        });
    }


    // =========================================================
    // ORDER PROCESSING
    // =========================================================

    static async sendOrderProcessing(order) {

        return this.send({
            to: order.email,
            subject:
                "⚙️ Your Order Is Being Processed | Triangle Sports",
            html:
                orderProcessing(order),
            type:
                "Order Processing Email"
        });
    }


    // =========================================================
    // ORDER PACKED
    // =========================================================

    static async sendOrderPacked(order) {

        return this.send({
            to: order.email,
            subject:
                "📦 Your Order Has Been Packed | Triangle Sports",
            html:
                orderPacked(order),
            type:
                "Order Packed Email"
        });
    }


    // =========================================================
    // ORDER SHIPPED
    // =========================================================

    static async sendOrderShipped(order) {

        return this.send({
            to: order.email,
            subject:
                "🚚 Your Order Is On Its Way | Triangle Sports",
            html:
                orderShipped(order),
            type:
                "Order Shipped Email"
        });
    }


    // =========================================================
    // ORDER DELIVERED
    // =========================================================

    static async sendOrderDelivered(order) {

        return this.send({
            to: order.email,
            subject:
                "✅ Your Order Has Been Delivered | Triangle Sports",
            html:
                orderDelivered(order),
            type:
                "Order Delivered Email"
        });
    }


    // =========================================================
    // ORDER CANCELLED
    // =========================================================

    static async sendOrderCancelled(order) {

        return this.send({
            to: order.email,
            subject:
                "Order Cancelled | Triangle Sports",
            html:
                orderCancelled(order),
            type:
                "Order Cancellation Email"
        });
    }

}


module.exports = EmailService;