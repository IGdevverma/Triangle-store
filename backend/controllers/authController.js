const User = require("../models/User");
const otpService = require("../services/otpService");


// ============================================================
// REGISTER USER
// ============================================================

const registerUser = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            phone
        } = req.body;


        // Basic validation
        if (
            !name ||
            !email ||
            !password ||
            !phone
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Name, email, password and phone are required"

            });

        }


        // Check existing user
        const existingUser =
            await User.findOne({ email });


        if (existingUser) {

            return res.status(400).json({

                success: false,

                message:
                    "Email already exists"

            });

        }


        // Normalize phone
        const normalizedPhone =
            otpService.normalizePhone(phone);


        // Create user
        const user =
            await User.create({

                name,

                email,

                password,

                phone:
                    normalizedPhone,

                role: "user",

                phoneVerified: false,

                phoneVerifiedAt: null

            });


        const token =
            user.getJWTToken();


        return res.status(201).json({

            success: true,

            message:
                "Registration successful",

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                phone: user.phone,

                phoneVerified:
                    user.phoneVerified,

                role: user.role

            }

        });


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Registration failed"

        });

    }

};



// ============================================================
// LOGIN USER
// ============================================================

const loginUser = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter email and password"

            });

        }


        const user =
            await User
                .findOne({ email })
                .select("+password");


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"

            });

        }


        const isMatched =
            await user.comparePassword(
                password
            );


        if (!isMatched) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"

            });

        }


        const token =
            user.getJWTToken();


        return res.status(200).json({

            success: true,

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                phone: user.phone,

                phoneVerified:
                    user.phoneVerified,

                role: user.role

            }

        });


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Login failed"

        });

    }

};


// ============================================================
// SEND PHONE OTP
// ============================================================

const sendPhoneOtp = async (req, res) => {

    try {

        const user = await User.findById(req.user._id);

        if (!user) {

            return res.status(404).json({

                success: false,
                message: "User not found"

            });

        }

        if (!user.phone) {

            return res.status(400).json({

                success: false,
                message: "Phone number not found"

            });

        }

        if (user.phoneVerified) {

            return res.status(400).json({

                success: false,
                message: "Phone number is already verified"

            });

        }


        // ====================================================
        // SEND OTP
        // ====================================================

        const result = await otpService.sendOtp({

            userId: user._id,

            phone: user.phone,

            forceResend: false

        });


        return res.status(200).json({

            success: true,

            message: result.message,

            expiresIn: result.expiresIn

        });

    }

    catch (error) {

        console.error(
            "SEND OTP ERROR:",
            error
        );


        // ================================================
        // OTP COOLDOWN
        // ================================================

        if (
            error.code === "OTP_COOLDOWN"
        ) {

            return res.status(429).json({

                success: false,

                message: error.message,

                remainingSeconds:
                    error.remainingSeconds

            });

        }


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to send OTP"

        });

    }

};


// ============================================================
// VERIFY PHONE OTP
// ============================================================

const verifyPhoneOtp = async (req, res) => {

    try {

        const {
            otp
        } = req.body;


        if (!otp) {

            return res.status(400).json({

                success: false,

                message:
                    "OTP is required"

            });

        }


        const user =
            await User.findById(
                req.user._id
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found"

            });

        }


        if (!user.phone) {

            return res.status(400).json({

                success: false,

                message:
                    "Phone number not found"

            });

        }


        if (user.phoneVerified) {

            return res.status(400).json({

                success: false,

                message:
                    "Phone number is already verified"

            });

        }


        /*
        --------------------------------------------------------
        VERIFY OTP WITH MSG91
        --------------------------------------------------------
        */

        const result =
            await otpService.verifyOtp({

                userId: user._id,

                phone: user.phone,

                otp: otp

            });


        if (!result.success) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid OTP"

            });

        }


        /*
        --------------------------------------------------------
        MARK USER VERIFIED
        --------------------------------------------------------
        */

        user.phoneVerified =
            true;

        user.phoneVerifiedAt =
            new Date();


        await user.save();


        return res.status(200).json({

            success: true,

            message:
                "Phone number verified successfully",

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                phone: user.phone,

                phoneVerified:
                    user.phoneVerified,

                phoneVerifiedAt:
                    user.phoneVerifiedAt,

                role: user.role

            }

        });


    } catch (error) {

        console.error(
            "VERIFY OTP ERROR:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "OTP verification failed"

        });

    }

};

// ============================================================
// VERIFY MSG91 WIDGET ACCESS TOKEN
// ============================================================

const verifyWidgetToken = async (req, res) => {

    try {

        const {
            accessToken,
            phone
        } = req.body;


        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (!accessToken) {

            return res.status(400).json({

                success: false,

                message:
                    "MSG91 access token is required"

            });

        }


        if (!phone) {

            return res.status(400).json({

                success: false,

                message:
                    "Phone number is required"

            });

        }


        // ----------------------------------------------------
        // NORMALIZE PHONE
        // ----------------------------------------------------

        const normalizedPhone =
            otpService.normalizePhone(phone);


        // ----------------------------------------------------
        // MSG91 AUTH KEY CHECK
        // ----------------------------------------------------

        if (!process.env.MSG91_AUTH_KEY) {

            console.error(
                "MSG91_AUTH_KEY is missing"
            );

            return res.status(500).json({

                success: false,

                message:
                    "MSG91 configuration is missing"

            });

        }


        // ----------------------------------------------------
        // VERIFY ACCESS TOKEN WITH MSG91
        // ----------------------------------------------------

        const response = await fetch(
            "https://control.msg91.com/api/v5/widget/verifyAccessToken",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "authkey":
                        process.env.MSG91_AUTH_KEY

                },

                body: JSON.stringify({

                    "access-token":
                        accessToken

                })

            }
        );


        const data =
            await response.json();


        console.log(
            "MSG91 ACCESS TOKEN RESPONSE:",
            data
        );


        // ----------------------------------------------------
        // MSG91 VERIFICATION FAILED
        // ----------------------------------------------------

        if (!response.ok) {

            return res.status(401).json({

                success: false,

                message:
                    "MSG91 access token verification failed"

            });

        }


        // ----------------------------------------------------
        // EXTRACT VERIFIED USER INFORMATION
        // ----------------------------------------------------

        const verifiedPhone =
            data?.data?.mobile ||
            data?.mobile ||
            data?.data?.phone ||
            data?.phone;


        if (!verifiedPhone) {

            return res.status(401).json({

                success: false,

                message:
                    "Verified phone number was not returned by MSG91"

            });

        }


        const normalizedVerifiedPhone =
            otpService.normalizePhone(
                verifiedPhone
            );


        // ----------------------------------------------------
        // SECURITY CHECK
        // ----------------------------------------------------
        // The phone verified by MSG91 MUST match
        // the phone submitted by the customer.
        // ----------------------------------------------------

        if (
            normalizedVerifiedPhone !==
            normalizedPhone
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Verified phone number does not match"

            });

        }


        // ----------------------------------------------------
        // FIND USER
        // ----------------------------------------------------

        const user =
            await User.findOne({

                phone:
                    normalizedPhone

            });


        // ----------------------------------------------------
        // USER FOUND
        // ----------------------------------------------------

        if (user) {

            user.phoneVerified =
                true;

            user.phoneVerifiedAt =
                new Date();

            await user.save();


            return res.status(200).json({

                success: true,

                message:
                    "Phone number verified successfully",

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    phone:
                        user.phone,

                    phoneVerified:
                        user.phoneVerified,

                    phoneVerifiedAt:
                        user.phoneVerifiedAt,

                    role:
                        user.role

                }

            });

        }


        // ----------------------------------------------------
        // GUEST USER
        // ----------------------------------------------------
        // Product-detail Buy Now can be used by a guest.
        // We don't create a database user here.
        // We simply confirm that MSG91 verified the phone.
        // ----------------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Phone number verified successfully",

            phone:
                normalizedPhone,

            phoneVerified:
                true

        });


    } catch (error) {

        console.error(
            "VERIFY WIDGET TOKEN ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Phone verification failed"

        });

    }

};


// ============================================================
// RESEND PHONE OTP
// ============================================================

const resendPhoneOtp = async (req, res) => {

    try {

        const user =
            await User.findById(
                req.user._id
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found"

            });

        }


        if (!user.phone) {

            return res.status(400).json({

                success: false,

                message:
                    "Phone number not found"

            });

        }


        if (user.phoneVerified) {

            return res.status(400).json({

                success: false,

                message:
                    "Phone number is already verified"

            });

        }


        const result =
            await otpService.resendOtp({

                userId: user._id,

                phone: user.phone

            });


        return res.status(200).json({

            success: true,

            message:
                result.message

        });


    } catch (error) {

        console.error(
            "RESEND OTP ERROR:",
            error
        );


        if (
            error.code ===
            "OTP_COOLDOWN"
        ) {

            return res.status(429).json({

                success: false,

                message:
                    error.message,

                remainingSeconds:
                    error.remainingSeconds

            });

        }


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to resend OTP"

        });

    }

};



// ============================================================
// UPDATE PROFILE
// ============================================================

const updateProfile = async (req, res) => {

    try {

        const {
            name,
            phone,
            gender
        } = req.body;


        const user =
            await User.findById(
                req.user._id
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found"

            });

        }


        /*
        --------------------------------------------------------
        PHONE CHANGE
        --------------------------------------------------------
        */

        if (
            phone &&
            phone !== user.phone
        ) {

            const normalizedPhone =
                otpService.normalizePhone(
                    phone
                );


            user.phone =
                normalizedPhone;


            /*
            New number must be verified again
            */

            user.phoneVerified =
                false;

            user.phoneVerifiedAt =
                null;

        }


        if (name !== undefined) {

            user.name = name;

        }


        if (gender !== undefined) {

            user.gender = gender;

        }


        await user.save();


        return res.status(200).json({

            success: true,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                phone: user.phone,

                phoneVerified:
                    user.phoneVerified,

                phoneVerifiedAt:
                    user.phoneVerifiedAt,

                gender: user.gender,

                role: user.role

            }

        });


    } catch (error) {

        console.error(
            "UPDATE PROFILE ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Profile update failed"

        });

    }

};



module.exports = {

    
    registerUser,

    loginUser,

    sendPhoneOtp,

    verifyPhoneOtp,

    resendPhoneOtp,

    verifyWidgetToken,

    updateProfile


};