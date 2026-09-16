const rateLimit = require("express-rate-limit");

/*
|--------------------------------------------------------------------------
| Authentication Rate Limiter
|--------------------------------------------------------------------------
| Protects login/register endpoints from brute-force and abuse.
|
| 20 requests per 15 minutes per IP.
|
*/

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 20,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many authentication requests. Please try again later."
    }
});


/*
|--------------------------------------------------------------------------
| OTP Rate Limiter
|--------------------------------------------------------------------------
| OTP endpoints need a stricter limit because SMS/OTP requests
| can cause abuse and unnecessary provider costs.
|
| 5 requests per 15 minutes per IP.
|
*/

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 5,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many OTP requests. Please try again later."
    }
});


/*
|--------------------------------------------------------------------------
| Widget Token Rate Limiter
|--------------------------------------------------------------------------
| Protects the public MSG91/widget verification endpoint.
|
| 10 requests per 15 minutes per IP.
|
*/

const widgetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 10,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many verification requests. Please try again later."
    }
});


module.exports = {
    authLimiter,
    otpLimiter,
    widgetLimiter
};