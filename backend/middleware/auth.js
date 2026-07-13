const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("./asyncHandler");

exports.isAuthenticatedUser = asyncHandler(async (req, res, next) => {

    const authHeader = req.headers.authorization;

    console.log("Authorization:", authHeader);

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Please Login First"
        });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            success: false,
            message: "Please Login First"
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded Token:", decoded);
    console.log("Decoded ID:", decoded.id);

    const user = await User.findById(decoded.id);

    console.log("User Found:", user);

    req.user = user;

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "User no longer exists"
        });
    }

    next();
});

exports.authorizeRoles = (...roles) => {

    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {

            return res.status(403).json({

                success: false,

                message: `Role (${req.user.role}) is not allowed`

            });

        }

        next();

    };
    

};
