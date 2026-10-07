const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("./asyncHandler");

exports.isAuthenticatedUser = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // No Authorization header
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Please Login First"
        });
    }

    // Validate Bearer token format
    const [scheme, token] = authHeader.trim().split(/\s+/);

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            success: false,
            message: "Invalid authentication format"
        });
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }

    // Validate JWT payload
    if (!decoded || !decoded.id) {
        return res.status(401).json({
            success: false,
            message: "Invalid authentication token"
        });
    }

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "User no longer exists"
        });
    }

    req.user = user;

    next();
});

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Please Login First"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource"
            });
        }

        next();
    };
};




// ============================================================
// OPTIONAL AUTHENTICATION
// ============================================================
// Used for endpoints that support BOTH:
// 1. Logged-in users
// 2. Verified guest users
//
// If a valid login token is present:
//     req.user = user
//
// If no login token is present:
//     req.user remains null
//
// IMPORTANT:
// This middleware does NOT authenticate guests.
// Guest verification is handled separately using
// X-Guest-Verification-Token.
// ============================================================

exports.optionalAuthentication = asyncHandler(
    async (req, res, next) => {

        const authHeader =
            req.headers.authorization;

        // --------------------------------------------
        // No login token = guest
        // --------------------------------------------

        if (!authHeader) {
            req.user = null;
            return next();
        }

        // --------------------------------------------
        // Validate Bearer format
        // --------------------------------------------

        const [scheme, token] =
            authHeader.trim().split(/\s+/);

        if (
            scheme !== "Bearer" ||
            !token
        ) {

            return res.status(401).json({
                success: false,
                message: "Invalid authentication format"
            });

        }

        // --------------------------------------------
        // Verify JWT
        // --------------------------------------------

        let decoded;

        try {

            decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

        } catch (error) {

            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });

        }

        // --------------------------------------------
        // Validate JWT payload
        // --------------------------------------------

        if (
            !decoded ||
            !decoded.id
        ) {

            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });

        }

        // --------------------------------------------
        // Find user
        // --------------------------------------------

        const user =
            await User.findById(decoded.id);

        if (!user) {

            return res.status(401).json({
                success: false,
                message: "User no longer exists"
            });

        }

        // --------------------------------------------
        // Attach authenticated user
        // --------------------------------------------

        req.user = user;

        next();
    }
);