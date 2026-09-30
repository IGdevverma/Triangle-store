const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
    isAuthenticatedUser,
    authorizeRoles
} = require("../middleware/auth");

const {
    createProduct,
    getProducts,
    getHomeProducts,
    getProductById,
    getRelatedProducts,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");


/* =========================================================
   CREATE PRODUCT
========================================================= */

router.post(
    "/",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    upload.fields([
        {
            name: "images",
            maxCount: 5
        },
        {
            name: "packImages",
            maxCount: 50
        },
        {
            name: "combinationImages",
            maxCount: 100
        },
        {
            name: "packCombinationImages",
            maxCount: 100
        }
    ]),
    createProduct
);


/* =========================================================
   GET HOME PRODUCTS
   IMPORTANT:
   Must come BEFORE "/:id"
========================================================= */

router.get(
    "/home",
    getHomeProducts
);


/* =========================================================
   GET RELATED PRODUCTS
   IMPORTANT:
   Must also come BEFORE "/:id"
========================================================= */

router.get(
    "/related",
    getRelatedProducts
);


/* =========================================================
   GET ALL PRODUCTS
========================================================= */

router.get(
    "/",
    getProducts
);


/* =========================================================
   GET SINGLE PRODUCT
   Keep this AFTER all named GET routes
========================================================= */

router.get(
    "/:id",
    getProductById
);


/* =========================================================
   UPDATE PRODUCT
========================================================= */

router.put(
    "/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    upload.fields([
        {
            name: "images",
            maxCount: 5
        },
        {
            name: "packImages",
            maxCount: 50
        },
        {
            name: "combinationImages",
            maxCount: 100
        },
        {
            name: "packCombinationImages",
            maxCount: 100
        }
    ]),
    updateProduct
);


/* =========================================================
   DELETE PRODUCT
========================================================= */

router.delete(
    "/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    deleteProduct
);


module.exports = router;