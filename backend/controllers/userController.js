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
// Get All Users (Admin)

const getAllUsers = asyncHandler(async (req, res) => {

    const users = await User.find().select("-password");

    res.status(200).json({

        success: true,

        count: users.length,

        users

    });

});


// Get Single User

const getSingleUser = asyncHandler(async (req, res) => {

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {

        return res.status(404).json({

            success: false,

            message: "User not found"

        });

    }

    res.status(200).json({

        success: true,

        user

    });

});

// Delete User
const mongoose = require("mongoose");

const deleteUser = asyncHandler(async (req, res) => {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid User ID"
        });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    if (user.role === "admin") {
        return res.status(400).json({
            success: false,
            message: "Admin account cannot be deleted"
        });
    }

    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: "User deleted successfully"
    });

});

// Update User Role


const updateUserRole = asyncHandler(async (req, res) => {
    

    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {

        return res.status(400).json({

            success: false,

            message: "Invalid role"

        });

    }

    const user = await User.findById(req.params.id);

    if (!user) {

        return res.status(404).json({

            success: false,

            message: "User not found"

        });

    }




    if (user.role === "admin" && role === "user") {

        const adminCount = await User.countDocuments({
            role: "admin"
        });

        if (adminCount === 1) {

            return res.status(400).json({
                success: false,
                message: "Cannot remove the last admin"
            });

        }

    }

    user.role = role;

    await user.save();

    res.status(200).json({

        success: true,

        message: "User role updated successfully",

        user

    });

});

module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    getSingleUser,
    deleteUser,
    updateUserRole
};