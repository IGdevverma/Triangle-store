const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");

// Register User
const registerUser = asyncHandler(async (req, res) => {

    const { name, email, password } = req.body;

    const user = await User.create({
        name,
        email,
        password
    });

    const token = user.getJWTToken();

    res.status(201).json({
        success: true,
        token,
        user
    });

});

// Login User
const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please enter email & password"
        });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid Email or Password"
        });
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return res.status(401).json({
            success: false,
            message: "Invalid Email or Password"
        });
    }

    const token = user.getJWTToken();

    res.status(200).json({
        success: true,
        token,
        user
    });

});

module.exports = {
    registerUser,
    loginUser
};