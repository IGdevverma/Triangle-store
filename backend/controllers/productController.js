const ApiFeatures = require("../utils/apiFeatures");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const ErrorHandler = require("../utils/errorHandler");

// Create Product
const createProduct = asyncHandler(async (req, res) => {

    try {

        console.log("========== CREATE PRODUCT ==========");
        console.log("FILES:", req.files);
        console.log("BODY:", req.body);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one product image is required"
            });
        }

        const imageUrls = req.files.map(file => file.path);

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

        // ==============================
        // COLORS
        // ==============================


        let colors = [];

        if (req.body.colors) {
            try {
                colors = JSON.parse(req.body.colors);

                if (!Array.isArray(colors)) {
                    colors = [];
                }

            } catch (error) {
                console.error("colors parse error:", error);
                colors = [];
            }
        }

        colors = colors
            .map(color => String(color).trim())
            .filter(color =>
                color &&
                color.toLowerCase() !== "undefined"
            );

        // ==============================
        // SIZES
        // ==============================

        let sizes = [];

        if (req.body.sizes) {
            try {
                sizes = JSON.parse(req.body.sizes);
            } catch (error) {
                sizes = [];
            }
        }

        sizes = sizes
            .map(size => String(size).trim())
            .filter(size => size);

        // ==============================
        // CREATE PRODUCT
        // ==============================

        const product = await Product.create({

            ...req.body,

            colors,
            sizes,

            sku,

            image: imageUrls[0],

            images: imageUrls

        });

        res.status(201).json({
            success: true,
            product
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
    try {
        console.log("========== UPDATE PRODUCT ==========");
        console.log("BODY:", req.body);
        console.log("FILES:", req.files);

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // ==========================================
        // 1. EXISTING IMAGES
        // ==========================================

        let existingImages = [];

        if (req.body.existingImages) {
            try {
                existingImages = JSON.parse(req.body.existingImages);
            } catch (error) {
                console.error("existingImages parse error:", error);

                return res.status(400).json({
                    success: false,
                    message: "Invalid existingImages format"
                });
            }
        } else {
            existingImages = product.images || [];
        }


        // ==========================================
        // 2. NEW IMAGES
        // ==========================================

        const newImages = req.files
            ? req.files.map(file => file.path)
            : [];


        console.log("EXISTING IMAGES:", existingImages);
        console.log("NEW IMAGES:", newImages);


        // ==========================================
        // 3. FINAL IMAGES
        // ==========================================

        const finalImages = [
            ...existingImages,
            ...newImages
        ];


        if (finalImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one product image is required"
            });
        }


        if (finalImages.length > 5) {
            return res.status(400).json({
                success: false,
                message: "Maximum 5 product images are allowed"
            });
        }


        // ==========================================
        // 4. COLORS
        // ==========================================

        let colors = [];

        if (req.body.colors) {
            try {

                colors = JSON.parse(req.body.colors);

                if (!Array.isArray(colors)) {
                    colors = [];
                }

            } catch (error) {

                console.error("colors parse error:", error);

                colors = [];
            }
        }


        // Clean colors
        colors = colors
            .map(color => String(color).trim())
            .filter(color =>
                color &&
                color.toLowerCase() !== "undefined"
            );

        // ==============================
        // SIZES
        // ==============================

        let sizes = [];

        if (req.body.sizes) {
            try {
                sizes = JSON.parse(req.body.sizes);

                if (!Array.isArray(sizes)) {
                    sizes = [];
                }

            } catch (error) {
                console.error("SIZES PARSE ERROR:", error);
                sizes = [];
            }
        }

        sizes = sizes
            .map(size => String(size).trim())
            .filter(size => size);

        console.log("FINAL SIZES:", sizes);


        // Clean sizes
        sizes = sizes
            .map(size => String(size).trim())
            .filter(size => size);


        console.log("FINAL COLORS:", colors);
        console.log("FINAL SIZES:", sizes);


        // ==========================================
        // 6. UPDATE NORMAL FIELDS
        // ==========================================

        Object.keys(req.body).forEach((key) => {

            if (
                key !== "image" &&
                key !== "images" &&
                key !== "existingImages" &&
                key !== "sizes" &&
                key !== "colors"
            ) {
                product[key] = req.body[key];
            }

        });
        product.sizes = sizes;
        product.colors = colors;


        // ==========================================
        // 7. SAVE COLORS + SIZES
        // ==========================================

        product.colors = colors;

        product.sizes = sizes;


        // ==========================================
        // 8. SAVE IMAGES
        // ==========================================

        product.images = finalImages;

        product.image = finalImages[0];


        // ==========================================
        // 9. SAVE PRODUCT
        // ==========================================

        const updatedProduct = await product.save();


        console.log("UPDATED PRODUCT:", updatedProduct);


        return res.status(200).json({
            success: true,
            product: updatedProduct
        });


    } catch (error) {

        console.error("UPDATE PRODUCT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update product"
        });

    }
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