const upload = require("../middleware/upload");

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

    upload.single("image"),

    createProduct

);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put(

    "/:id",

    updateProduct

);
router.delete(

    "/:id",

    deleteProduct

);

module.exports = router;