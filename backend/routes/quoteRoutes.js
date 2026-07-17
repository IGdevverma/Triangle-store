const express = require("express");

const router = express.Router();

const {

    createQuote,

    getQuotes,

    getQuote,

    updateQuoteStatus,

    deleteQuote

} = require("../controllers/quoteController");

const {

    isAuthenticatedUser,

    authorizeRoles

} = require("../middleware/auth");


// ==========================================
// Public Routes
// ==========================================

// Customer submits quote

router.post("/", createQuote);


// ==========================================
// Admin Routes
// ==========================================

// Get all quotes

router.get(

    "/",

    isAuthenticatedUser,

    authorizeRoles("admin"),

    getQuotes

);


// Get single quote

router.get(

    "/:id",

    isAuthenticatedUser,

    authorizeRoles("admin"),

    getQuote

);


// Update quote status

router.put(

    "/:id",

    isAuthenticatedUser,

    authorizeRoles("admin"),

    updateQuoteStatus

);


// Delete quote

router.delete(

    "/:id",

    isAuthenticatedUser,

    authorizeRoles("admin"),

    deleteQuote

);

module.exports = router;