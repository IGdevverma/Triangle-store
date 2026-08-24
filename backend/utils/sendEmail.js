require("dotenv").config();

const axios = require("axios");

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const sendEmail = async ({ to, subject, html }) => {

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!to) {
        throw new Error("Recipient email is required.");
    }

    if (!subject) {
        throw new Error("Email subject is required.");
    }

    if (!html) {
        throw new Error("Email HTML content is required.");
    }

    if (!process.env.BREVO_API_KEY) {
        throw new Error("BREVO_API_KEY is missing in .env");
    }

    if (!process.env.EMAIL_FROM) {
        throw new Error("EMAIL_FROM is missing in .env");
    }


    // ==========================================
    // EMAIL PAYLOAD
    // ==========================================

    const payload = {

        sender: {
            name: process.env.EMAIL_FROM_NAME || "Triangle Sports",
            email: process.env.EMAIL_FROM
        },

        to: [
            {
                email: to
            }
        ],

        subject,

        htmlContent: html

    };


    // ==========================================
    // SEND EMAIL
    // ==========================================

    try {

        console.log("📧 Sending email...");
        console.log("To:", to);
        console.log("Subject:", subject);

        const response = await axios.post(
            BREVO_API_URL,
            payload,
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY,
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },

                timeout: 15000
            }
        );


        // ==========================================
        // SUCCESS
        // ==========================================

        console.log("✅ Email accepted by Brevo");

        console.log({
            messageId: response.data?.messageId,
            to
        });

        return response.data;


    } catch (error) {

        // ==========================================
        // BREVO ERROR
        // ==========================================

        console.error("❌ Email sending failed");


        if (error.response) {

            console.error("Status:", error.response.status);

            console.error(
                "Brevo Response:",
                error.response.data
            );

        } else if (error.request) {

            console.error(
                "No response received from Brevo."
            );

        } else {

            console.error(
                "Error:",
                error.message
            );

        }

        throw error;

    }

};


module.exports = sendEmail;