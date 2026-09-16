const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const ErrorHandler = require("../utils/errorHandler");
const cloudinary = require("../config/cloudinary");


// ============================================================
// CLOUDINARY BUFFER UPLOAD
// ============================================================

const uploadBufferToCloudinary = (
    buffer,
    folder = "triangle-sports"
) => {
    return new Promise((resolve, reject) => {

        const uploadStream =
            cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: "image"
                },
                (error, result) => {

                    if (error) {
                        return reject(error);
                    }

                    resolve(result);
                }
            );

        uploadStream.end(buffer);
    });
};


// ============================================================
// UPLOAD ALL MULTER FILES TO CLOUDINARY
// ============================================================

const uploadFilesToCloudinary = async (files = []) => {

    return Promise.all(

        files.map(async (file) => {

            if (!file.buffer) {
                throw new Error(
                    "Uploaded file buffer is missing"
                );
            }

            const result =
                await uploadBufferToCloudinary(
                    file.buffer,
                    "triangle-sports"
                );

            return {
                ...file,
                path: result.secure_url,
                filename: result.public_id
            };
        })
    );
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Safely parse JSON
 */
const parseJSON = (value, fallback = []) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (typeof value !== "string") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
};


/**
 * Convert value to Number safely
 */
const toNumber = (value, defaultValue = 0) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return defaultValue;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : defaultValue;
};


/**
 * Clean string array
 */
const cleanStringArray = (value) => {

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map(item => String(item).trim())
        .filter(item =>
            item &&
            item.toLowerCase() !== "undefined" &&
            item.toLowerCase() !== "null"
        );
};


/**
 * Get uploaded files safely
 */
const getFiles = (files, fieldName) => {

    if (!files || !files[fieldName]) {
        return [];
    }

    return Array.isArray(files[fieldName])
        ? files[fieldName]
        : [files[fieldName]];
};



// ============================================================
// CREATE PRODUCT
// ============================================================

const createProduct = asyncHandler(async (req, res) => {

    try {

        console.log("==========================================");
        console.log("CREATE PRODUCT");
        console.log("==========================================");

        console.log("BODY:", req.body);
        console.log("FILES:", req.files);


        // =====================================================
        // PRODUCT IMAGES
        // =====================================================

        const productFiles = await uploadFilesToCloudinary(
            getFiles(req.files, "images")
        );

        const packFiles = await uploadFilesToCloudinary(
            getFiles(req.files, "packImages")
        );

        const combinationFiles = await uploadFilesToCloudinary(
            getFiles(req.files, "combinationImages")
        );


        if (productFiles.length === 0) {

            return res.status(400).json({
                success: false,
                message: "At least one product image is required"
            });

        }


        const imageUrls = productFiles.map(
            file => file.path
        );

        const packImageUrls = packFiles.map(
            file => file.path
        );

        const combinationImageUrls =
            combinationFiles.map(
                file => file.path
            );


        console.log("PRODUCT IMAGES:", imageUrls);
        console.log("PACK IMAGES:", packImageUrls);
        console.log(
            "COMBINATION IMAGES:",
            combinationImageUrls
        );


        // =====================================================
        // SKU
        // =====================================================

        const sku =
            "TS-" +
            Date.now();



        // =====================================================
        // PRICE
        // =====================================================

        /*
         * IMPORTANT:
         * Frontend FormData sends values as strings.
         *
         * Example:
         * originalPrice = "1299"
         * price = "999"
         *
         * MongoDB should receive:
         * originalPrice = 1299
         * price = 999
         */

        if (req.body.price === undefined || req.body.price === "") {
            return res.status(400).json({
                success: false,
                message: "Price is required"
            });
        }

        const price = Number(req.body.price);

        if (isNaN(price) || price <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be greater than 0"
            });
        }

        let originalPrice = 0;

        if (req.body.originalPrice !== undefined && req.body.originalPrice !== "") {
            originalPrice = Number(req.body.originalPrice);

            if (isNaN(originalPrice) || originalPrice < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Original price must be a valid non-negative number"
                });
            }

            if (originalPrice > 0 && originalPrice < price) {
                return res.status(400).json({
                    success: false,
                    message: "Original price must be greater than or equal to price"
                });
            }
        } else {
            originalPrice = price;
        }

        let discount = 0;

        if (req.body.discount !== undefined && req.body.discount !== "") {
            discount = toNumber(req.body.discount, 0);
        } else if (originalPrice > price && originalPrice > 0) {
            discount = Math.round(
                ((originalPrice - price) / originalPrice) * 100
            );
        }


        console.log("PRICE:", price);
        console.log(
            "ORIGINAL PRICE:",
            originalPrice
        );
        console.log(
            "DISCOUNT:",
            discount
        );


        // =====================================================
        // COLORS
        // =====================================================

        let colors = parseJSON(
            req.body.colors,
            []
        );

        if (!Array.isArray(colors)) {

            return res.status(400).json({
                success: false,
                message: "Colors must be an array"
            });

        }

        colors = cleanStringArray(colors);



        // =====================================================
        // SIZES
        // =====================================================

        let sizes = parseJSON(
            req.body.sizes,
            []
        );

        if (!Array.isArray(sizes)) {
            sizes = [];
        }

        sizes = cleanStringArray(sizes);



        // =====================================================
        // PACKS
        // =====================================================

        let packs = parseJSON(
            req.body.packs,
            []
        );

        if (!Array.isArray(packs)) {
            packs = [];
        }


        /*
         * Normalize pack imageCount
         */

        packs = packs.map(pack => ({

            ...pack,

            imageCount: toNumber(
                pack.imageCount,
                0
            )

        }));



        // =====================================================
        // COLOR COMBINATIONS
        // =====================================================

        let colorCombinations = parseJSON(
            req.body.colorCombinations,
            []
        );

        if (!Array.isArray(colorCombinations)) {
            colorCombinations = [];
        }



        // =====================================================
        // PACK-WISE IMAGES
        // =====================================================

        let packImageIndex = 0;


        packs = packs.map(pack => {

            const imageCount = toNumber(
                pack.imageCount,
                0
            );


            const newImages =
                packImageUrls.slice(
                    packImageIndex,
                    packImageIndex + imageCount
                );


            packImageIndex += imageCount;


            /*
             * Existing images if frontend sends any
             */

            const existingPackImages =
                Array.isArray(pack.images)
                    ? pack.images
                    : pack.image
                        ? [pack.image]
                        : [];


            const finalPackImages = [
                ...existingPackImages,
                ...newImages
            ];


            return {

                ...pack,

                image:
                    finalPackImages[0] || "",

                images:
                    finalPackImages

            };

        });



        // =====================================================
        // COLOR COMBINATION IMAGES
        // =====================================================

        let combinationImageIndex = 0;


        colorCombinations =
            colorCombinations.map(
                combination => {

                    const imageCount =
                        toNumber(
                            combination.imageCount,
                            0
                        );


                    const images =
                        combinationImageUrls.slice(
                            combinationImageIndex,
                            combinationImageIndex +
                            imageCount
                        );


                    combinationImageIndex +=
                        imageCount;


                    return {

                        ...combination,

                        image:
                            images[0] || "",

                        images

                    };

                }
            );



        // =====================================================
        // CREATE PRODUCT DATA
        // =====================================================

        const productData = {

            ...req.body,

            // IMPORTANT NUMERIC FIELDS
            price,
            originalPrice,
            discount,



            productMode:
                typeof req.body.productMode === "string"
                    ? req.body.productMode.trim().toLowerCase()
                    : "single",


            productGroup:
                typeof req.body.productGroup === "string"
                    ? req.body.productGroup.trim()
                    : "",

            // ARRAYS
            colors,
            sizes,
            packs,
            colorCombinations,

            // PRODUCT IDENTIFICATION
            sku,

            // IMAGES
            image: imageUrls[0],
            images: imageUrls

        };


        /*
         * Remove raw JSON strings because we already
         * converted them into proper arrays.
         */

        delete productData.colors;
        delete productData.sizes;
        delete productData.packs;
        delete productData.colorCombinations;


        productData.colors = colors;
        productData.sizes = sizes;
        productData.packs = packs;
        productData.colorCombinations =
            colorCombinations;



        // =====================================================
        // CREATE
        // =====================================================

        const product =
            await Product.create(productData);


        console.log(
            "PRODUCT CREATED:",
            product._id
        );

        console.log(
            "SAVED PRICE:",
            product.price
        );

        console.log(
            "SAVED ORIGINAL PRICE:",
            product.originalPrice
        );


        return res.status(201).json({

            success: true,

            product

        });

    } catch (error) {

        console.error(
            "CREATE PRODUCT ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to create product"

        });

    }

});



// ============================================================
// GET ALL PRODUCTS
// ============================================================

const getProducts = asyncHandler(async (req, res) => {

    const products =
        await Product.find();


    console.log(
        "========== GET PRODUCTS =========="
    );

    console.log(
        "PRODUCT COUNT:",
        products.length
    );


    if (products.length > 0) {

        console.log(
            "FIRST PRODUCT ID:",
            products[0]._id
        );

        console.log(
            "FIRST PRODUCT NAME:",
            products[0].name
        );

        console.log(
            "FIRST PRODUCT PRICE:",
            products[0].price
        );

        console.log(
            "FIRST PRODUCT ORIGINAL PRICE:",
            products[0].originalPrice
        );

        console.log(
            "FIRST PRODUCT PACKS:",
            products[0].packs
        );

    }


    return res.status(200).json({

        success: true,

        totalProducts:
            products.length,

        count:
            products.length,

        products

    });

});



// ============================================================
// GET SINGLE PRODUCT
// ============================================================

const getProductById = asyncHandler(
    async (req, res, next) => {

        const product =
            await Product.findById(
                req.params.id
            );


        if (!product) {

            return next(
                new ErrorHandler(
                    "Product not found",
                    404
                )
            );

        }


        return res.status(200).json({

            success: true,

            product

        });

    }
);



// ============================================================
// UPDATE PRODUCT
// ============================================================

const updateProduct = asyncHandler(
    async (req, res) => {

        try {

            console.log("==========================================");
            console.log("UPDATE PRODUCT");
            console.log("==========================================");

            console.log(
                "PRODUCT ID:",
                req.params.id
            );

            console.log(
                "BODY:",
                req.body
            );

            console.log(
                "FILES:",
                req.files
            );


            // =================================================
            // FIND PRODUCT
            // =================================================

            const product =
                await Product.findById(
                    req.params.id
                );


            if (!product) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Product not found"

                });

            }



            // =================================================
            // PRODUCT IMAGES
            // =================================================

            let existingImages = [];


            if (
                req.body.existingImages !==
                undefined
            ) {

                existingImages =
                    parseJSON(
                        req.body.existingImages,
                        []
                    );


                if (
                    !Array.isArray(
                        existingImages
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid existingImages format"

                    });

                }

            } else {

                existingImages =
                    product.images || [];

            }



            // =================================================
            // NEW PRODUCT IMAGES
            // =================================================

            const productFiles =
                await uploadFilesToCloudinary(
                    getFiles(req.files, "images")
                );


            const newImages =
                productFiles.map(
                    file => file.path
                );



            // =================================================
            // FINAL PRODUCT IMAGES
            // =================================================

            let finalImages = [

                ...existingImages,

                ...newImages

            ];


            if (finalImages.length === 0) {

                return res.status(400).json({

                    success: false,

                    message:
                        "At least one product image is required"

                });

            }


            if (finalImages.length > 5) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Maximum 5 product images are allowed"

                });

            }



            // =================================================
            // MAIN IMAGE
            // =================================================

            const mainImage =
                req.body.mainImage;


            if (
                mainImage &&
                finalImages.includes(mainImage)
            ) {

                const mainIndex =
                    finalImages.indexOf(
                        mainImage
                    );


                finalImages.splice(
                    mainIndex,
                    1
                );


                finalImages.unshift(
                    mainImage
                );

            }



            // =================================================
            // PACK IMAGES
            // =================================================
            const packFiles =
                await uploadFilesToCloudinary(
                    getFiles(req.files, "packImages")
                );


            const newPackImages =
                packFiles.map(
                    file => file.path
                );


            console.log(
                "NEW PACK IMAGES:",
                newPackImages
            );



            // =================================================
            // COLOR COMBINATION IMAGES
            // =================================================

            const combinationFiles =
                await uploadFilesToCloudinary(
                    getFiles(req.files, "combinationImages")
                );

            const newCombinationImages =
                combinationFiles.map(
                    file => file.path
                );


            console.log(
                "NEW COMBINATION IMAGES:",
                newCombinationImages
            );



            // =================================================
            // PACK OPTIONS
            // =================================================

            let packs =
                product.packs || [];


            if (
                req.body.packs !==
                undefined
            ) {

                packs =
                    parseJSON(
                        req.body.packs,
                        []
                    );


                if (!Array.isArray(packs)) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Packs must be an array"

                    });

                }

            }



            // =================================================
            // PROCESS PACKS
            // =================================================

            let packImageIndex = 0;


            packs = packs.map(pack => {

                const imageCount =
                    toNumber(
                        pack.imageCount,
                        0
                    );


                /*
                 * Newly uploaded images
                 */

                const uploadedImages =
                    newPackImages.slice(
                        packImageIndex,
                        packImageIndex +
                        imageCount
                    );


                packImageIndex +=
                    imageCount;



                /*
                 * Existing pack images
                 */

                const existingPackImages =
                    Array.isArray(
                        pack.images
                    )
                        ? pack.images
                        : pack.image
                            ? [pack.image]
                            : [];



                /*
                 * Images removed by frontend
                 */

                const removedPackImages =
                    Array.isArray(
                        pack.removedImages
                    )
                        ? pack.removedImages
                        : [];



                /*
                 * Keep existing images that
                 * were NOT removed
                 */

                const filteredExistingPackImages =
                    existingPackImages.filter(
                        image =>
                            !removedPackImages.includes(
                                image
                            )
                    );



                /*
                 * Existing remaining images
                 * + newly uploaded images
                 */

                const finalPackImages = [

                    ...filteredExistingPackImages,

                    ...uploadedImages

                ];



                return {

                    ...pack,

                    imageCount:
                        finalPackImages.length,

                    image:
                        finalPackImages[0] || "",

                    images:
                        finalPackImages,

                    /*
                     * Don't save frontend-only
                     * removedImages field
                     */

                    removedImages:
                        undefined

                };

            });



            // =================================================
            // COLORS
            // =================================================

            let colors =
                product.colors || [];


            if (
                req.body.colors !==
                undefined
            ) {

                colors =
                    parseJSON(
                        req.body.colors,
                        []
                    );


                if (!Array.isArray(colors)) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Colors must be an array"

                    });

                }

            }


            colors =
                cleanStringArray(
                    colors
                );



            // =================================================
            // SIZES
            // =================================================

            let sizes =
                product.sizes || [];


            if (
                req.body.sizes !==
                undefined
            ) {

                sizes =
                    parseJSON(
                        req.body.sizes,
                        []
                    );


                if (!Array.isArray(sizes)) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Sizes must be an array"

                    });

                }

            }


            sizes =
                cleanStringArray(
                    sizes
                );



            // =================================================
            // COLOR COMBINATIONS
            // =================================================

            let colorCombinations =
                product.colorCombinations || [];


            if (
                req.body.colorCombinations !==
                undefined
            ) {

                colorCombinations =
                    parseJSON(
                        req.body.colorCombinations,
                        []
                    );


                if (
                    !Array.isArray(
                        colorCombinations
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Color combinations must be an array"

                    });

                }

            }



            // =================================================
            // PROCESS COLOR COMBINATION IMAGES
            // =================================================

            let combinationImageIndex = 0;


            colorCombinations =
                colorCombinations.map(
                    combination => {

                        const imageCount =
                            toNumber(
                                combination.imageCount,
                                0
                            );


                        const uploadedImages =
                            newCombinationImages.slice(
                                combinationImageIndex,
                                combinationImageIndex +
                                imageCount
                            );


                        combinationImageIndex +=
                            imageCount;



                        /*
                         * Existing images
                         */

                        const existingCombinationImages =
                            Array.isArray(
                                combination.images
                            )
                                ? combination.images
                                : combination.image
                                    ? [combination.image]
                                    : [];



                        /*
                         * Removed images
                         */

                        const removedImages =
                            Array.isArray(
                                combination.removedImages
                            )
                                ? combination.removedImages
                                : [];



                        /*
                         * Filter removed images
                         */

                        const filteredExistingImages =
                            existingCombinationImages.filter(
                                image =>
                                    !removedImages.includes(
                                        image
                                    )
                            );



                        /*
                         * Final combination images
                         */

                        const finalCombinationImages = [

                            ...filteredExistingImages,

                            ...uploadedImages

                        ];



                        return {

                            ...combination,

                            image:
                                finalCombinationImages[0] || "",

                            images:
                                finalCombinationImages,

                            removedImages:
                                undefined

                        };

                    }
                );



            // =================================================
            // PRICE & ORIGINAL PRICE
            // =================================================

            /*
             * VERY IMPORTANT:
             *
             * Only update price / originalPrice if frontend actually sends the field.
             * This prevents accidental reset or unwanted overrides during partial updates.
             */

            if (req.body.price !== undefined && req.body.price !== "") {
                const parsedPrice = Number(req.body.price);

                if (isNaN(parsedPrice) || parsedPrice <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Price must be greater than 0"
                    });
                }

                product.price = parsedPrice;
            }

            if (req.body.originalPrice !== undefined && req.body.originalPrice !== "") {
                const parsedOriginalPrice = Number(req.body.originalPrice);

                if (isNaN(parsedOriginalPrice) || parsedOriginalPrice < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Original price must be a valid non-negative number"
                    });
                }

                product.originalPrice = parsedOriginalPrice;
            }

            /*
             * VALIDATION:
             * If both originalPrice and price are positive,
             * originalPrice should normally be >= price.
             */
            if (
                product.originalPrice !== undefined &&
                product.originalPrice > 0 &&
                product.price !== undefined &&
                product.price > 0 &&
                product.originalPrice < product.price
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Original price must be greater than or equal to price"
                });
            }

            // DISCOUNT
            if (req.body.discount !== undefined && req.body.discount !== "") {
                product.discount = toNumber(req.body.discount, 0);
            } else if (product.originalPrice && product.originalPrice > product.price) {
                product.discount = Math.round(
                    ((product.originalPrice - product.price) / product.originalPrice) * 100
                );
            } else {
                product.discount = 0;
            }



            // =================================================
            // NORMAL PRODUCT FIELDS
            // =================================================

            /*
             * Fields that are handled separately
             * should NOT be copied from req.body.
             */

            const excludedFields = new Set([

                "_id",

                "__v",

                "image",

                "images",

                "existingImages",

                "mainImage",

                "price",

                "originalPrice",

                "discount",

                "colors",

                "sizes",

                "packs",

                "colorCombinations",

                "removedImages",

                "packImages",

                "combinationImages"

            ]);



            Object.keys(req.body).forEach(
                key => {

                    if (
                        excludedFields.has(key)
                    ) {
                        return;
                    }


                    /*
                     * Don't save empty undefined values
                     */

                    if (
                        req.body[key] !==
                        undefined
                    ) {

                        product[key] =
                            req.body[key];

                    }

                }
            );

            if (req.body.productMode !== undefined) {
                product.productMode =
                    String(req.body.productMode).trim().toLowerCase();
            }



            // =================================================
            // PRODUCT GROUP
            // =================================================

            if (req.body.productGroup !== undefined) {
                product.productGroup =
                    String(req.body.productGroup).trim();
            }


            // =================================================
            // SAVE ARRAYS
            // =================================================

            product.colors =
                colors;


            product.sizes =
                sizes;


            product.packs =
                packs;


            product.colorCombinations =
                colorCombinations;



            // =================================================
            // SAVE PRODUCT IMAGES
            // =================================================

            product.images =
                finalImages;


            product.image =
                finalImages[0];



            // =================================================
            // DEBUG PRICE
            // =================================================

            console.log(
                "========== FINAL VALUES =========="
            );

            console.log(
                "PRICE:",
                product.price
            );

            console.log(
                "ORIGINAL PRICE:",
                product.originalPrice
            );

            console.log(
                "DISCOUNT:",
                product.discount
            );

            console.log(
                "COLORS:",
                product.colors
            );

            console.log(
                "SIZES:",
                product.sizes
            );

            console.log(
                "PACKS:",
                product.packs
            );

            console.log(
                "COLOR COMBINATIONS:",
                product.colorCombinations
            );



            // =================================================
            // SAVE
            // =================================================

            const updatedProduct =
                await product.save();



            // =================================================
            // AFTER SAVE DEBUG
            // =================================================

            console.log(
                "========== AFTER SAVE =========="
            );

            console.log(
                "PRODUCT ID:",
                updatedProduct._id
            );

            console.log(
                "PRICE:",
                updatedProduct.price
            );

            console.log(
                "ORIGINAL PRICE:",
                updatedProduct.originalPrice
            );

            console.log(
                "DISCOUNT:",
                updatedProduct.discount
            );



            return res.status(200).json({

                success: true,

                product:
                    updatedProduct

            });

        } catch (error) {

            console.error(
                "UPDATE PRODUCT ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to update product"

            });

        }

    }
);



// ============================================================
// DELETE PRODUCT
// ============================================================

const deleteProduct = asyncHandler(
    async (req, res) => {

        const product =
            await Product.findById(
                req.params.id
            );


        if (!product) {

            return res.status(404).json({

                success: false,

                message:
                    "Product not found"

            });

        }


        await Product.findByIdAndDelete(
            req.params.id
        );


        return res.status(200).json({

            success: true,

            message:
                "Product Deleted Successfully"

        });

    }
);



// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    createProduct,

    getProducts,

    getProductById,

    updateProduct,

    deleteProduct

};