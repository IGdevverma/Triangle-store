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
            required: true
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
| when expiresAt is reached.
|
*/

otpSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);


/*
|--------------------------------------------------------------------------
| COMPOUND INDEX
|--------------------------------------------------------------------------
| Helps quickly find OTP records for a specific
| user + phone combination.
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