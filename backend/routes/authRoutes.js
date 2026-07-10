const express = require("express");

const router = express.Router();
router.get("/test", (req, res) => {

    res.send("Auth Route Working");

});
const {
    registerUser,
    loginUser,
    updateProfile,
    
} = require("../controllers/authController");

const {
    isAuthenticatedUser
} = require("../middleware/auth");

router.post("/register", registerUser);

router.post("/login", loginUser);


router.put(

  "/profile",

  isAuthenticatedUser,

  updateProfile

);

module.exports = router;