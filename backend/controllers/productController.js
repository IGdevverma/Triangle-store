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
        // PACKS
        // ==============================

        let packs = [];

        if (req.body.packs) {
            try {

                packs = JSON.parse(req.body.packs);

                if (!Array.isArray(packs)) {
                    packs = [];
                }

            } catch (error) {

                console.error("packs parse error:", error);
                packs = [];

            }
        }

        // ==============================
        // CREATE PRODUCT
        // ==============================
        console.log("FINAL PACKS TO SAVE:", packs);
        const product = await Product.create({


            ...req.body,

            colors,
            sizes,
            packs,

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

    const products = await Product.find();

    console.log("========== GET PRODUCTS ==========");
    console.log("PRODUCT COUNT:", products.length);
    console.log("FIRST PRODUCT ID:", products[0]?._id);
    console.log("FIRST PRODUCT NAME:", products[0]?.name);
    console.log("FIRST PRODUCT PACKS:", products[0]?.packs);

    res.status(200).json({
        success: true,
        totalProducts: products.length,
        count: products.length,
        products
    });

});

// Get Single Product
const getProductById = asyncHandler(async (req, res, next) => {

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
const updateProduct = asyncHandler(async (req, res) => {
    try {
        console.log("========== UPDATE PRODUCT ==========");
        console.log("BODY:", req.body);
        console.log("FILES:", req.files);
        console.log("========== PACK DEBUG ==========");
        console.log("REQ.BODY.PACKS:", req.body.packs);
        console.log("PACKS TYPE:", typeof req.body.packs);

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
        // 3.5 MAIN IMAGE
        // ==========================================

        const mainImage = req.body.mainImage;

        if (mainImage && finalImages.includes(mainImage)) {

            const mainIndex = finalImages.indexOf(mainImage);

            finalImages.splice(mainIndex, 1);

            finalImages.unshift(mainImage);

        }




        // ==========================================
        // 3.8 PACK OPTIONS
        // ==========================================

        let packs = product.packs || [];

        if (req.body.packs !== undefined) {
            try {

                packs = JSON.parse(req.body.packs);

                if (!Array.isArray(packs)) {
                    return res.status(400).json({
                        success: false,
                        message: "Packs must be an array"
                    });
                }

            } catch (error) {

                console.error("PACKS PARSE ERROR:", error);

                return res.status(400).json({
                    success: false,
                    message: "Invalid packs format"
                });
            }
        }

        console.log("FINAL PACKS:", packs);


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
                key !== "colors" &&
                key !== "packs"
            ) {
                product[key] = req.body[key];
            }

        });
        product.sizes = sizes;
        product.colors = colors;
        product.packs = packs;


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
        console.log("========== AFTER SAVE ==========");
        console.log("UPDATED PRODUCT ID:", updatedProduct._id);
        console.log("UPDATED PRODUCT PACKS:", updatedProduct.packs);


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