const mongoose = require("mongoose");

const razorpayWebhookEventSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            unique: true,
            sparse: true,
            index: true
        },

        event: {
            type: String,
            required: true,
            index: true
        },

        razorpayOrderId: {
            type: String,
            default: null,
            index: true
        },

        razorpayPaymentId: {
            type: String,
            default: null,
            index: true
        },

        payload: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

        processed: {
            type: Boolean,
            default: false,
            index: true
        },

        processedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "RazorpayWebhookEvent",
    razorpayWebhookEventSchema
);