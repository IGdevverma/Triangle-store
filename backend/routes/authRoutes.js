const express = require("express");

const router = express.Router();
router.get("/test", (req, res) => {

    res.send("Auth Route Working");

});
const {
    registerUser,
    loginUser,
    updateProfile,
    verifyMsg91Otp,
    
} = require("../controllers/authController");

const {
    isAuthenticatedUser
} = require("../middleware/auth");

router.post("/register", registerUser);

router.post("/login", loginUser);
router.post("/verify-otp", verifyMsg91Otp);


router.put(

  "/profile",

  isAuthenticatedUser,

  updateProfile

);

module.exports = router;