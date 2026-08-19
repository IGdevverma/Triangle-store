const ApiFeatures = require("../utils/apiFeatures");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const ErrorHandler = require("../utils/errorHandler");

// Create Product
const createProduct = asyncHandler(async (req, res) => {
    try {
        console.log("========== CREATE PRODUCT ==========");
        console.log("FILE:", req.file);

        if (req.file) {
            console.log("PATH:", req.file.path);
            console.log("FILENAME:", req.file.filename);

            req.body.image = req.file.path;
        }

        console.log("BODY:", req.body);
        const existingProduct = await Product.findOne({
            name: req.body.name
        });

        if (existingProduct) {

            return res.status(400).json({

                success: false,

                message: "Product with this name already exists"

            });

        }
        const sku = "TS-" + Date.now();

        req.body.sku = sku;
        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            product,
        });
    } catch (err) {
        console.error("CREATE PRODUCT ERROR:", err);
        throw err;
    }
});

// Get All Products
const getProducts = asyncHandler(async (req, res) => {

    const resultPerPage = 8;

    const totalProducts = await Product.countDocuments();

    const apiFeature = new ApiFeatures(Product.find(), req.query)
        .search()
        .filter()
        .sort()
        .pagination(resultPerPage);

    const products = await apiFeature.query;

    res.status(200).json({
        success: true,
        totalProducts,
        count: products.length,
        products
    });

});

// Get Single Product
const getProductById = asyncHandler(async (req, res) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        product
    });

});

// Update Product
// Update Product
const updateProduct = asyncHandler(async (req, res) => {

    console.log("========== UPDATE PRODUCT ==========");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    // Update image only if a new image was selected
    if (req.file) {
        console.log("NEW IMAGE PATH:", req.file.path);

        product.image = req.file.path;
    }

    // Update other product fields
    Object.keys(req.body).forEach((key) => {

        if (key !== "image") {
            product[key] = req.body[key];
        }

    });

    const updatedProduct = await product.save();

    console.log("UPDATED PRODUCT:", updatedProduct);

    res.status(200).json({
        success: true,
        product: updatedProduct
    });

});

// Delete Product
const deleteProduct = asyncHandler(async (req, res) => {

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "Product Deleted Successfully"
    });

});

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};