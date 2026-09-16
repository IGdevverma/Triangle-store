const User = require("../models/User");
const otpService = require("../services/otpService");
const EmailService = require("../services/emailService");

// ============================================================
// REGISTER USER
// ============================================================

const registerUser = async (req, res) => {

    try {

        const nameValue = String(req.body.name || "").trim();
        const emailValue = String(req.body.email || "").trim();
        const passwordValue = String(req.body.password || "");
        const phoneValue = String(req.body.phone || "").trim();


        // Basic validation
        if (
            !nameValue ||
            !emailValue ||
            !passwordValue ||
            !phoneValue
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Name, email, password and phone are required"

            });

        }

        // Password length validation
        if (String(password).length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        if (String(password).length > 72) {
            return res.status(400).json({
                success: false,
                message: "Password cannot exceed 72 characters"
            });
        }

        // Normalize email
        const normalizedEmail =
            String(email).trim().toLowerCase();

        // Check existing user
        const existingUser =
            await User.findOne({
                email: normalizedEmail
            });


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

                email: normalizedEmail,

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


        const normalizedEmail =
            String(email).trim().toLowerCase();

        const user =
            await User
                .findOne({ email: normalizedEmail })
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


        if (!/^\d{6}$/.test(String(otp))) {
            return res.status(400).json({
                success: false,
                message: "OTP must be a 6-digit number"
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



// ============================================================
// FORGOT PASSWORD
// ============================================================

const crypto = require("crypto");
// ============================================================
// FORGOT PASSWORD
// ============================================================

const forgotPassword = async (req, res) => {
    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email"
            });
        }

        const normalizedEmail =
            String(email).trim().toLowerCase();

        const user =
            await User.findOne({
                email: normalizedEmail
            });

        // Do not reveal whether the email exists
        if (!user) {
            return res.status(200).json({
                success: true,
                message:
                    "If an account exists with this email, a password reset link has been sent."
            });
        }

        // Generate secure random token
        const resetToken =
            crypto.randomBytes(32).toString("hex");

        // Store only hashed token in database
        user.resetPasswordToken =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

        // Token valid for 15 minutes
        user.resetPasswordExpire =
            new Date(Date.now() + 15 * 60 * 1000);

        await user.save({
            validateBeforeSave: false
        });

        // Build frontend reset URL
        const frontendUrl =
            process.env.FRONTEND_URL ||
            "http://localhost:4200";

        const resetUrl =
            `${frontendUrl}/reset-password/${resetToken}`;

        // Send password reset email
        await EmailService.sendPasswordReset(
            user.email,
            resetUrl
        );

        return res.status(200).json({
            success: true,
            message:
                "If an account exists with this email, a password reset link has been sent."
        });

    } catch (error) {

        console.error(
            "FORGOT PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to process password reset request"
        });
    }
};


// ============================================================
// RESET PASSWORD
// ============================================================

const resetPassword = async (req, res) => {
    try {

        const { token } = req.params;
        const { password } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Invalid password reset token"
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Please enter a new password"
            });
        }

        // Same password rules as signup
        if (String(password).length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        if (String(password).length > 72) {
            return res.status(400).json({
                success: false,
                message: "Password cannot exceed 72 characters"
            });
        }

        // Hash the token received from the reset link
        const hashedToken =
            crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");

        // Find user with valid, non-expired token
        const user =
            await User.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpire: {
                    $gt: new Date()
                }
            }).select("+resetPasswordToken");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Password reset token is invalid or expired"
            });
        }

        // Set new password
        user.password = password;

        // Invalidate reset token immediately
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful. Please login with your new password."
        });

    } catch (error) {

        console.error(
            "RESET PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to reset password"
        });
    }
};


module.exports = {


    registerUser,

    loginUser,

    sendPhoneOtp,
    forgotPassword,
    resetPassword,

    verifyPhoneOtp,

    resendPhoneOtp,

    verifyWidgetToken,

    updateProfile


};