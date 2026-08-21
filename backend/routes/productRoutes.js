const upload = require("../middleware/upload");
const {
    isAuthenticatedUser,
    authorizeRoles
} = require("../middleware/auth");

const express = require("express");
const router = express.Router();

const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} = require("../controllers/productController");


/* =========================
   CREATE PRODUCT
========================= */

router.post(
    "/",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    upload.array("images", 5),
    createProduct
);


/* =========================
   GET PRODUCTS
========================= */

router.get("/", getProducts);

router.get("/:id", getProductById);


/* =========================
   UPDATE PRODUCT
========================= */

router.put(
    "/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    upload.array("images", 5),
    updateProduct
);


/* =========================
   DELETE PRODUCT
========================= */

router.delete(
    "/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    deleteProduct
);


module.exports = router;