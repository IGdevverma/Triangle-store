const razorpay = require("../config/razorpay");

/**
 * Initiates a full Razorpay refund for a paid order.
 *
 * IMPORTANT:
 * - Order cancellation must already be committed in MongoDB.
 * - This service must NOT be called inside a MongoDB transaction.
 * - Final refund completion should be confirmed through Razorpay webhook.
 */
const initiateRefund = async (order, reason = "Order cancelled") => {

    if (!order) {
        throw new Error("Order is required for refund");
    }

    // ==========================================
    // BASIC PAYMENT VALIDATION
    // ==========================================

    if (!order.razorpayPaymentId) {
        throw new Error(
            "Razorpay payment ID is missing"
        );
    }

    if (!order.razorpayOrderId) {
        throw new Error(
            "Razorpay order ID is missing"
        );
    }

    if (order.paymentStatus !== "Paid") {
        throw new Error(
            `Refund cannot be initiated for payment status: ${order.paymentStatus}`
        );
    }

    // ==========================================
    // REFUND STATE PROTECTION
    // ==========================================

    if (
        order.refundStatus === "Processing" ||
        order.refundStatus === "Completed"
    ) {
        throw new Error(
            "Refund has already been initiated or completed"
        );
    }

    // ==========================================
    // FETCH PAYMENT FROM RAZORPAY
    // ==========================================

    const payment =
        await razorpay.payments.fetch(
            order.razorpayPaymentId
        );

    if (!payment) {
        throw new Error(
            "Razorpay payment could not be found"
        );
    }

    // ==========================================
    // PAYMENT OWNERSHIP VALIDATION
    // ==========================================

    if (
        payment.order_id !==
        order.razorpayOrderId
    ) {
        throw new Error(
            "Razorpay payment does not belong to this order"
        );
    }

    // ==========================================
    // PAYMENT STATUS VALIDATION
    // ==========================================

    if (payment.status !== "captured") {
        throw new Error(
            `Refund requires a captured payment. Current status: ${payment.status}`
        );
    }

    // ==========================================
    // CURRENCY VALIDATION
    // ==========================================

    if (payment.currency !== "INR") {
        throw new Error(
            "Only INR payments can be refunded"
        );
    }

    // ==========================================
    // REFUND AMOUNT
    // ==========================================

    const refundAmount =
        Number(order.refundAmount || order.total || 0);

    if (
        !Number.isFinite(refundAmount) ||
        refundAmount <= 0
    ) {
        throw new Error(
            "Invalid refund amount"
        );
    }

    const refundAmountInPaise =
        Math.round(refundAmount * 100);

    if (
        !Number.isInteger(refundAmountInPaise) ||
        refundAmountInPaise <= 0
    ) {
        throw new Error(
            "Invalid refund amount"
        );
    }

    // ==========================================
    // PAYMENT AMOUNT VALIDATION
    // ==========================================

    if (
        Number(payment.amount) !==
        refundAmountInPaise
    ) {
        throw new Error(
            "Refund amount does not match the captured payment amount"
        );
    }

    // ==========================================
    // PREVENT OVER-REFUND
    // ==========================================

    const amountRefunded =
        Number(payment.amount_refunded || 0);

    const remainingRefundableAmount =
        Number(payment.amount) -
        amountRefunded;

    if (
        refundAmountInPaise >
        remainingRefundableAmount
    ) {
        throw new Error(
            "Refund amount exceeds the remaining refundable amount"
        );
    }

    // ==========================================
    // INITIATE RAZORPAY REFUND
    // ==========================================
    let refund;

    try {
        refund = await razorpay.payments.refund(
            order.razorpayPaymentId,
            {
                amount: refundAmountInPaise,

                notes: {
                    order_id: String(order._id),

                    razorpay_order_id:
                        order.razorpayOrderId,

                    reason:
                        String(reason).slice(0, 250)
                }
            }
        );

    } catch (error) {

        console.error("❌ RAZORPAY REFUND API ERROR");

        console.error("Status:", error?.statusCode);
        console.error("Code:", error?.error?.code);
        console.error("Description:", error?.error?.description);
        console.error("Reason:", error?.error?.reason);

        console.error(
            "Full Razorpay error:",
            error?.error || error?.response?.data || error?.message || error
        );

        throw error;
    }

    if (!refund || !refund.id) {
        throw new Error(
            "Razorpay refund was not created"
        );
    }

    return {
        refundId: refund.id,

        status:
            refund.status || "created",

        amount:
            Number(refund.amount || refundAmountInPaise),

        currency:
            refund.currency || "INR"
    };
};

module.exports = {
    initiateRefund
};