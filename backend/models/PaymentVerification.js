const mongoose = require("mongoose");

const paymentVerificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        razorpayOrderId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        razorpayPaymentId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        amount: {
            type: Number,
            required: true
        },

        currency: {
            type: String,
            required: true,
            enum: ["INR"]
        },

        verifiedAt: {
            type: Date,
            default: Date.now
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Automatically remove old verification records
paymentVerificationSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
    "PaymentVerification",
    paymentVerificationSchema
);