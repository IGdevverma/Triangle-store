const axios = require("axios");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const OtpVerification = require("../models/OtpVerification");


/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const MSG91_BASE_URL =
    "https://control.msg91.com/api/v5/otp";

const OTP_EXPIRY_MINUTES = 5;

const OTP_RESEND_COOLDOWN_SECONDS = 30;

const MAX_OTP_ATTEMPTS = 5;


/*
|--------------------------------------------------------------------------
| Normalize Phone
|--------------------------------------------------------------------------
*/

function normalizePhone(phone) {

    if (!phone) {
        throw new Error("Phone number is required");
    }

    let normalized = String(phone)
        .replace(/\s+/g, "")
        .replace(/-/g, "");

    /*
    | Convert:
    | 9990180409
    | +919990180409
    | 919990180409
    |
    | into:
    | 919990180409
    */

    if (normalized.startsWith("+")) {
        normalized = normalized.substring(1);
    }

    if (normalized.startsWith("0")) {
        normalized = "91" + normalized.substring(1);
    }

    if (normalized.length === 10) {
        normalized = "91" + normalized;
    }

    if (!/^91\d{10}$/.test(normalized)) {
        throw new Error("Invalid Indian mobile number");
    }

    return normalized;
}


/*
|--------------------------------------------------------------------------
| Generate OTP
|--------------------------------------------------------------------------
*/

function generateOtp() {

    return crypto
        .randomInt(100000, 1000000)
        .toString();

}


/*
|--------------------------------------------------------------------------
| Send OTP through MSG91
|--------------------------------------------------------------------------
*/

async function sendOtp({
    userId,
    phone,
    forceResend = false
}) {

    const normalizedPhone =
        normalizePhone(phone);

    /*
    |--------------------------------------------------------------------------
    | Environment validation
    |--------------------------------------------------------------------------
    */

    if (!process.env.MSG91_AUTH_KEY) {

        throw new Error(
            "MSG91_AUTH_KEY is missing"
        );

    }

    if (!process.env.MSG91_OTP_TEMPLATE_ID) {

        throw new Error(
            "MSG91_OTP_TEMPLATE_ID is missing"
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Check existing OTP
    |--------------------------------------------------------------------------
    */

    const existingOtp =
        await OtpVerification.findOne({
            userId,
            phone: normalizedPhone
        }).sort({
            createdAt: -1
        });


    /*
    |--------------------------------------------------------------------------
    | Resend cooldown
    |--------------------------------------------------------------------------
    */

    if (
        existingOtp &&
        !forceResend
    ) {

        const secondsSinceLastSend =
            Math.floor(
                (
                    Date.now() -
                    new Date(
                        existingOtp.lastSentAt
                    ).getTime()
                ) / 1000
            );


        if (
            secondsSinceLastSend <
            OTP_RESEND_COOLDOWN_SECONDS
        ) {

            const remaining =
                OTP_RESEND_COOLDOWN_SECONDS -
                secondsSinceLastSend;

            const error =
                new Error(
                    `Please wait ${remaining} seconds before requesting another OTP`
                );

            error.code =
                "OTP_COOLDOWN";

            error.remainingSeconds =
                remaining;

            throw error;
        }

    }


    /*
    |--------------------------------------------------------------------------
    | Generate OTP
    |--------------------------------------------------------------------------
    */

    const otp =
        generateOtp();


    /*
    |--------------------------------------------------------------------------
    | Hash OTP
    |--------------------------------------------------------------------------
    */

    const otpHash =
        await bcrypt.hash(
            otp,
            10
        );


    /*
    |--------------------------------------------------------------------------
    | Expiry
    |--------------------------------------------------------------------------
    */

    const expiresAt =
        new Date(
            Date.now() +
            OTP_EXPIRY_MINUTES *
            60 *
            1000
        );


    /*
    |--------------------------------------------------------------------------
    | Remove previous OTP
    |--------------------------------------------------------------------------
    */

    await OtpVerification.deleteMany({
        userId,
        phone: normalizedPhone
    });


    /*
    |--------------------------------------------------------------------------
    | Create new OTP record
    |--------------------------------------------------------------------------
    */

    const otpRecord =
        await OtpVerification.create({

            userId,

            phone:
                normalizedPhone,

            otpHash,

            expiresAt,

            attempts: 0,

            lastSentAt:
                new Date()

        });


    /*
    |--------------------------------------------------------------------------
    | Send OTP using MSG91
    |--------------------------------------------------------------------------
    */

    try {

        const response =
            await axios.post(
                MSG91_BASE_URL,
                null,
                {
                    params: {

                        template_id:
                            process.env
                                .MSG91_OTP_TEMPLATE_ID,

                        mobile:
                            normalizedPhone,

                        authkey:
                            process.env
                                .MSG91_AUTH_KEY

                    },

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    timeout: 10000

                }
            );


        /*
        |--------------------------------------------------------------------------
        | MSG91 failed
        |--------------------------------------------------------------------------
        */

        if (
            !response.data ||
            response.status < 200 ||
            response.status >= 300
        ) {

            await OtpVerification.deleteOne({
                _id: otpRecord._id
            });

            throw new Error(
                "Failed to send OTP"
            );

        }


        /*
        |--------------------------------------------------------------------------
        | NEVER return OTP
        |--------------------------------------------------------------------------
        */

        return {

            success: true,

            message:
                "OTP sent successfully",

            expiresIn:
                OTP_EXPIRY_MINUTES * 60

        };

    } catch (error) {

        /*
        |--------------------------------------------------------------------------
        | Cleanup OTP if MSG91 fails
        |--------------------------------------------------------------------------
        */

        await OtpVerification.deleteOne({
            _id: otpRecord._id
        }).catch(() => { });


        console.error(
            "MSG91 OTP Error:",
            error.response?.data ||
            error.message
        );


        throw new Error(
            "Unable to send OTP. Please try again."
        );

    }

}


/*
|--------------------------------------------------------------------------
| Verify OTP locally
|--------------------------------------------------------------------------
*/

async function verifyOtp({
    userId,
    phone,
    otp
}) {

    const normalizedPhone =
        normalizePhone(phone);


    /*
    |--------------------------------------------------------------------------
    | Find OTP
    |--------------------------------------------------------------------------
    */

    const otpRecord =
        await OtpVerification
            .findOne({
                userId,
                phone: normalizedPhone
            })
            .sort({
                createdAt: -1
            });


    if (!otpRecord) {

        throw new Error(
            "OTP not found or expired"
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Already verified
    |--------------------------------------------------------------------------
    */

    if (otpRecord.verifiedAt) {

        throw new Error(
            "OTP has already been used"
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Expiry
    |--------------------------------------------------------------------------
    */

    if (
        new Date() >
        otpRecord.expiresAt
    ) {

        await OtpVerification.deleteOne({
            _id: otpRecord._id
        });

        throw new Error(
            "OTP has expired"
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Maximum attempts
    |--------------------------------------------------------------------------
    */

    if (
        otpRecord.attempts >=
        MAX_OTP_ATTEMPTS
    ) {

        await OtpVerification.deleteOne({
            _id: otpRecord._id
        });

        throw new Error(
            "Too many incorrect attempts. Please request a new OTP."
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Increment attempt
    |--------------------------------------------------------------------------
    */

    otpRecord.attempts += 1;

    await otpRecord.save();


    /*
    |--------------------------------------------------------------------------
    | Compare hashed OTP
    |--------------------------------------------------------------------------
    */

    const isValid =
        await bcrypt.compare(
            String(otp),
            otpRecord.otpHash
        );


    if (!isValid) {

        throw new Error(
            "Invalid OTP"
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Mark verified
    |--------------------------------------------------------------------------
    */

    otpRecord.verifiedAt =
        new Date();

    await otpRecord.save();


    /*
    |--------------------------------------------------------------------------
    | OTP can now be consumed
    |--------------------------------------------------------------------------
    */

    await OtpVerification.deleteOne({
        _id: otpRecord._id
    });


    return {

        success: true,

        message:
            "OTP verified successfully"

    };

}



// ============================================================
// RESEND OTP
// ============================================================

async function resendOtp({
    userId,
    phone
}) {

    return sendOtp({
        userId,
        phone,
        forceResend: false
    });

}


module.exports = {

    sendOtp,

    verifyOtp,

    normalizePhone

};