const Quote = require("../models/Quote");
const sendEmail = require("../utils/sendEmail");
const adminQuoteReceived = require("../templates/adminQuoteReceived");

// =========================
// Create Quote
// =========================

const createQuote = async (req, res) => {

    try {

        // Save quote
        const quote = await Quote.create(req.body);

        // Send admin email
        try {

            await sendEmail({

                to: process.env.ADMIN_EMAIL,

                subject: `📩 New Manufacturing Quote - ${quote.name}`,

                html: adminQuoteReceived(quote)

            });

            console.log("✅ Admin email sent.");

        } catch (mailError) {

            console.error("❌ Admin Mail Error:", mailError);

        }

        res.status(201).json({

            success: true,

            message: "Quote submitted successfully.",

            quote

        });

    } catch (error) {

        console.error("Create Quote Error:", error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};




// =========================
// Get All Quotes (Admin)
// =========================

const getQuotes = async (req, res) => {

    try {

        const quotes = await Quote.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            quotes
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch quotes."
        });

    }

};

// =========================
// Get Single Quote
// =========================

const getQuote = async (req, res) => {

    try {

        const quote = await Quote.findById(req.params.id).lean();

        if (!quote) {

            return res.status(404).json({

                success: false,

                message: "Quote not found."

            });

        }

        res.status(200).json({

            success: true,

            quote

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Unable to fetch quote."

        });

    }

};





// =========================
// Update Quote Status
// =========================

const updateQuoteStatus = async (req, res) => {

    try {

        const allowedStatus = [

            "Pending",

            "Contacted",

            "Quotation Sent",

            "Approved",

            "Production",

            "Completed",

            "Rejected"

        ];

        if (!allowedStatus.includes(req.body.status)) {

            return res.status(400).json({

                success: false,

                message: "Invalid status."

            });

        }

        const quote = await Quote.findByIdAndUpdate(

            req.params.id,

            {

                status: req.body.status

            },

            {

                new: true,

                runValidators: true

            }

        );

        if (!quote) {

            return res.status(404).json({

                success: false,

                message: "Quote not found."

            });

        }

        res.status(200).json({

            success: true,

            message: "Quote status updated successfully.",

            quote

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Unable to update quote."

        });

    }

};

// =========================
// Delete Quote
// =========================

const deleteQuote = async (req, res) => {
    try {
        const quote = await Quote.findByIdAndDelete(req.params.id);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Quote deleted successfully."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to delete quote."
        });
    }
};

module.exports = {

    createQuote,

    getQuotes,

    getQuote,

    updateQuoteStatus,

    deleteQuote

};