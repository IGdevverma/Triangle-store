require("dotenv").config();
const axios = require("axios");

module.exports = async ({ to, subject, html }) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: process.env.EMAIL_FROM_NAME,
          email: process.env.EMAIL_FROM,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("✅ Email Sent");
    console.log(response.data);

    return response.data;

  } catch (err) {

    console.error("❌ BREVO ERROR");

    if (err.response) {
      console.error(err.response.data);
    } else {
      console.error(err.message);
    }

    throw err;
  }
};