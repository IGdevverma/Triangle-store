const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        phone: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        otpHash: {
            type: String,
            required: true
        },

        expiresAt: {
            type: Date,
            required: true,
            index: true
        },

        attempts: {
            type: Number,
            default: 0,
            min: 0
        },

        lastSentAt: {
            type: Date,
            required: true
        },

        verifiedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


/*
|--------------------------------------------------------------------------
| TTL INDEX
|--------------------------------------------------------------------------
| MongoDB automatically removes the OTP document
| after expiresAt is reached.
|
*/

otpSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);


/*
|--------------------------------------------------------------------------
| Compound Index
|--------------------------------------------------------------------------
| Helps us quickly find OTP for a specific user + phone.
|
*/

otpSchema.index({
    userId: 1,
    phone: 1
});


module.exports = mongoose.model(
    "OtpVerification",
    otpSchema
);