const mongoose = require("mongoose");

/* ============================================================
   COLOR COMBINATION SCHEMA
   Used inside individual packs.

   Example:
   2 Pack
   ├── Black + Grey
   └── White + Black

   3 Pack
   ├── Black + Grey + White
   └── White + Black + Grey
============================================================ */

const packCombinationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    colors: {
      type: [String],
      default: [],
    },

    // Main combination image
    image: {
      type: String,
      default: "",
      trim: true,
    },

    // Multiple combination images
    images: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  }
);


/* ============================================================
   PRODUCT PACK SCHEMA

   Each pack is completely independent.

   Example:

   Product
   ├── Single
   │   └── Product shipping
   │
   ├── 2 Pack
   │   ├── Price
   │   ├── Shipping
   │   ├── Colors
   │   ├── Sizes
   │   └── Combinations
   │
   └── 3 Pack
       ├── Price
       ├── Shipping
       ├── Colors
       ├── Sizes
       └── Combinations
============================================================ */

const productPackSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: [1, "Pack quantity must be at least 1"],
    },

    /* ========================================================
       PACK PRICING
    ======================================================== */

    price: {
      type: Number,
      required: true,
      min: [0, "Pack price cannot be negative"],
    },

    originalPrice: {
      type: Number,
      default: 0,
      min: [0, "Pack original price cannot be negative"],
    },

    discount: {
      type: Number,
      default: 0,
      min: [0, "Pack discount cannot be negative"],
    },


    /* ========================================================
       PACK SHIPPING DETAILS

       These are separate from the main product shipping
       details.

       Example:

       Single:
       weight = 0.5kg

       2 Pack:
       weight = 0.8kg

       3 Pack:
       weight = 1.1kg
    ======================================================== */

    weight: {
      type: Number,
      default: 0.5,
      min: [0.001, "Pack weight must be greater than 0"],
    },

    length: {
      type: Number,
      default: 25,
      min: [1, "Pack length must be at least 1 cm"],
    },

    breadth: {
      type: Number,
      default: 20,
      min: [1, "Pack breadth must be at least 1 cm"],
    },

    height: {
      type: Number,
      default: 3,
      min: [1, "Pack height must be at least 1 cm"],
    },


    /* ========================================================
       PACK COLORS
    ======================================================== */

    colors: {
      type: [String],
      default: [],
    },


    /* ========================================================
       PACK SIZES
    ======================================================== */

    sizes: {
      type: [String],
      default: [],
    },


    /* ========================================================
       PACK IMAGES
    ======================================================== */

    image: {
      type: String,
      default: "",
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },


    /* ========================================================
       PACK-SPECIFIC COLOR COMBINATIONS

       IMPORTANT:

       This is now nested inside the pack.

       2 Pack:
       combinations = [
         {
           name: "Black + Grey",
           colors: ["Black", "Grey"]
         }
       ]

       3 Pack:
       combinations = [
         {
           name: "Black + Grey + White",
           colors: ["Black", "Grey", "White"]
         }
       ]
    ======================================================== */

    combinations: {
      type: [packCombinationSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);


/* ============================================================
   MAIN PRODUCT SCHEMA
============================================================ */

const productSchema = new mongoose.Schema(
  {
    /* ========================================================
       BASIC PRODUCT INFORMATION
    ======================================================== */

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    productMode: {
      type: String,
      enum: ["single", "pack"],
      default: "single",
      index: true,
    },

    productGroup: {
      type: String,
      trim: true,
      index: true,
      default: "",
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },


    /* ========================================================
       PRODUCT PRICING
    ======================================================== */

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be greater than 0"],
    },

    originalPrice: {
      type: Number,
      default: 0,
      min: [0, "Original price cannot be negative"],
    },

    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },


    /* ========================================================
       CATEGORY
    ======================================================== */

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },


    /* ========================================================
       PRODUCT IMAGES
    ======================================================== */

    image: {
      type: String,
      default: "",
      trim: true,
    },

    images: {
      type: [String],
      required: [true, "Product images are required"],
      default: [],
    },


    /* ========================================================
       INVENTORY
    ======================================================== */

    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },


    /* ========================================================
       PRODUCT SHIPPING DETAILS

       Used for SINGLE product.

       For PACK products, the pack-level shipping fields
       inside `packs[]` are used.
    ======================================================== */

    weight: {
      type: Number,
      required: true,
      min: [0.001, "Product weight must be greater than 0"],
    },

    length: {
      type: Number,
      required: true,
      min: [1, "Product length must be at least 1 cm"],
    },

    breadth: {
      type: Number,
      required: true,
      min: [1, "Product breadth must be at least 1 cm"],
    },

    height: {
      type: Number,
      required: true,
      min: [1, "Product height must be at least 1 cm"],
    },


    /* ========================================================
       PRODUCT FLAGS
    ======================================================== */

    featured: {
      type: Boolean,
      default: false,
    },

    showOnHome: {
      type: Boolean,
      default: false,
    },


    /* ========================================================
       PRODUCT INFORMATION
    ======================================================== */

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    fabric: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      default: "",
      trim: true,
    },


    /* ========================================================
       PRODUCT COLORS
    ======================================================== */

    colors: {
      type: [String],
      default: [],
    },


    /* ========================================================
       PRODUCT SIZES
    ======================================================== */

    sizes: {
      type: [String],
      default: [],
    },


    /* ========================================================
       PRODUCT STATUS
    ======================================================== */

    status: {
      type: String,
      enum: ["Active", "Draft", "Hidden"],
      default: "Active",
      index: true,
    },


    /* ========================================================
       PRODUCT PACKS

       IMPORTANT:

       For pack products this is the main source of:

       - Pack price
       - Pack colors
       - Pack sizes
       - Pack images
       - Pack shipping
       - Pack combinations
    ======================================================== */

    packs: {
      type: [productPackSchema],
      default: [],
    },


    /* ========================================================
       LEGACY / GLOBAL COLOR COMBINATIONS

       Keep this for backward compatibility with existing
       products/data.

       New pack products should use:

       packs[].combinations[]
    ======================================================== */

    colorCombinations: [
      {
        id: {
          type: String,
          required: true,
          trim: true,
        },

        name: {
          type: String,
          required: true,
          trim: true,
        },

        colors: {
          type: [String],
          default: [],
        },

        images: {
          type: [String],
          default: [],
        },

        image: {
          type: String,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);


/* ============================================================
   VALIDATION HELPERS
============================================================ */

/* ============================================================
   VALIDATION HELPERS
============================================================ */

/*
 * Make sure originalPrice is never lower than price.
 */
productSchema.pre("validate", function () {

  if (
    this.originalPrice > 0 &&
    this.originalPrice < this.price
  ) {
    throw new Error(
      "Original price must be greater than or equal to product price"
    );
  }

});


/*
 * Validate pack pricing and shipping dimensions.
 *
 * We intentionally do not make pack shipping fields required
 * because old database packs may not contain these fields.
 *
 * Defaults will be used for old packs until admin updates them.
 */
productSchema.pre("validate", function () {

  if (!Array.isArray(this.packs)) {
    return;
  }

  for (const pack of this.packs) {

    // ========================================================
    // PACK PRICE
    // ========================================================

    if (
      pack.originalPrice > 0 &&
      pack.originalPrice < pack.price
    ) {
      throw new Error(
        `Original price must be greater than or equal to price for pack "${pack.name}"`
      );
    }


    // ========================================================
    // PACK QUANTITY
    // ========================================================

    if (pack.quantity < 1) {
      throw new Error(
        `Pack quantity must be at least 1 for pack "${pack.name}"`
      );
    }


    // ========================================================
    // PACK WEIGHT
    // ========================================================

    if (pack.weight <= 0) {
      throw new Error(
        `Pack weight must be greater than 0 for pack "${pack.name}"`
      );
    }


    // ========================================================
    // PACK DIMENSIONS
    // ========================================================

    if (
      pack.length <= 0 ||
      pack.breadth <= 0 ||
      pack.height <= 0
    ) {
      throw new Error(
        `Pack dimensions must be greater than 0 for pack "${pack.name}"`
      );
    }

    // ========================================================
    // PACK COMBINATIONS
    // ========================================================

    if (
      pack.quantity > 1 &&
      Array.isArray(pack.combinations)
    ) {

      for (const combination of pack.combinations) {

        const selectedColors =
          Array.isArray(combination.colors)
            ? combination.colors
              .map(color => String(color).trim())
              .filter(Boolean)
            : [];

        console.log(
          "PACK COMBINATION VALIDATION:",
          {
            pack: pack.name,
            quantity: pack.quantity,
            combination: combination.name,
            colors: selectedColors,
            colorCount: selectedColors.length
          }
        );

        if (
          selectedColors.length !==
          pack.quantity
        ) {
          throw new Error(
            `Combination "${combination.name}" in "${pack.name}" must contain exactly ${pack.quantity} colors`
          );
        }
      }
    }
  }
});






module.exports = mongoose.model(
  "Product",
  productSchema
);