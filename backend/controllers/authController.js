
const User = require("../models/User");

// Register User

const registerUser = async (req, res) => {

    try {

        const { name, email, password, role } = req.body;

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
            role: role || "user"

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
    console.log("Request Body:", req.body);
    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Please enter email and password"
            });

        }

        const user = await User.findOne({ email }).select("+password");
        console.log("User:", user);
        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }

        const isMatched = await user.comparePassword(password);
        console.log("Password Matched:", isMatched);
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
// Create Admin (Development Only)

const createAdmin = async (req, res) => {

    try {

        const existingAdmin = await User.findOne({

            email: "admin@tyka.com"

        });

        if (existingAdmin) {

            return res.status(400).json({

                success: false,

                message: "Admin already exists"

            });

        }

        const admin = await User.create({

            name: "Admin",

            email: "admin@tyka.com",

            password: "ALPHA.OP12",

            role: "admin"

        });

        res.status(201).json({

            success: true,

            message: "Admin created successfully",

            admin

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
    createAdmin

};
