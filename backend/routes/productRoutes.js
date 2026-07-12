const upload = require("../middleware/upload");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const express = require("express");

const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
router.post(

    "/",

    isAuthenticatedUser,

    authorizeRoles("admin"),

    upload.single("image"),

    createProduct

);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put(

    "/:id",

    isAuthenticatedUser,

    authorizeRoles("admin"),

    updateProduct

);
router.delete(

    "/:id",

    isAuthenticatedUser,

    authorizeRoles("admin"),

    deleteProduct

);

module.exports = router;
