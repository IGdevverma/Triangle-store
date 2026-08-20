
const User = require("../models/User");
const mongoose = require("mongoose");
const axios = require("axios");

// Register User

const registerUser = async (req, res) => {


    try {

        const { name, email, password, phone } = req.body;

        const existingUser = await User.findOne({ email });


        if (existingUser) {

            return res.status(400).json({

                success: false,

                message: "Email already exists"

            });

        }

        const user = await User.create({

            name,

            email,

            password,
            phone,
            // Public registration must never be able to create an admin account.
            role: "user"

        });

        const token = user.getJWTToken();
        
        res.status(201).json({

            success: true,

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                role: user.role

            }

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



// Login User

const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Please enter email and password"
            });

        }

        const user = await User.findOne({ email }).select("+password");
       console.log("User Found:", !!user);

        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }

        const isMatched = await user.comparePassword(password);
        console.log("Password Match:", isMatched);
        if (!isMatched) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }

        const token = user.getJWTToken();

        res.status(200).json({

            success: true,

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                role: user.role

            }

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



//OTP

const verifyMsg91Otp = async (req, res) => {

    try {

        const { accessToken, phone } = req.body;

        if (!accessToken) {

            return res.status(400).json({

                success: false,
                message: "MSG91 access token is required"

            });

        }

        const response = await fetch(
            "https://control.msg91.com/api/v5/widget/verifyAccessToken",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    authkey: process.env.MSG91_AUTH_KEY,

                    "access-token": accessToken

                })

            }
        );

        const data = await response.json();

        console.log("MSG91 VERIFY RESPONSE:", data);

        if (!response.ok) {

            return res.status(401).json({

                success: false,
                message: "MSG91 OTP verification failed",
                data

            });

        }

        // MSG91 verification successful
        // User handling will be added after
        // we confirm the exact response structure.

        return res.status(200).json({

            success: true,
            message: "OTP verified successfully",
            data

        });

    } catch (error) {

        console.error("MSG91 OTP ERROR:", error);

        return res.status(500).json({

            success: false,
            message: "OTP verification failed"

        });

    }

};


const updateProfile = async (req, res) => {

    try {

        const { name, phone, gender } = req.body;

        const user = await User.findByIdAndUpdate(

            req.user._id,

            {
                name,
                phone,
                gender
            },

            {
                new: true,
                runValidators: true
            }

        );

        res.status(200).json({

            success: true,

            user

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};





module.exports = {

    registerUser,
    verifyMsg91Otp,
    loginUser,
    updateProfile,



};
