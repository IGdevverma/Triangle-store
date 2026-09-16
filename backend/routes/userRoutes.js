const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser,
    getAllUsers,
    getSingleUser,
    deleteUser,
    updateUserRole
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", isAuthenticatedUser, (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user
    });
});


router.get(
    "/",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    getAllUsers
);

router.get(
    "/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    getSingleUser
);

router.delete(
    "/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    deleteUser
);

router.put(
    "/:id/role",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    updateUserRole
);


module.exports = router;