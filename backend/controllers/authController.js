
const User = require("../models/User");
const mongoose = require("mongoose");

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
       

        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }

        const isMatched = await user.comparePassword(password);

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

    loginUser,
    updateProfile,


};
