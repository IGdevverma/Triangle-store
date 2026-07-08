const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be greater than 0"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
    },

    image: {
      type: String,
      required: [true, "Image is required"],
    },

    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },

    featured: {
      type: Boolean,
      default: false,
    },



    brand: {
      type: String,
      default: "",
    },

    sku: {
      type: String,
      default: "",
    },

    fabric: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      default: "",
    },

    discount: {
      type: Number,
      default: 0,
    },

    colors: [
      {
        type: String,
      },
    ],

    sizes: [
      {
        type: String,
      },
    ],

    status: {
      type: String,
      enum: ["Active", "Draft", "Hidden"],
      default: "Active",
    },

    showOnHome: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }






);

module.exports = mongoose.model("Product", productSchema);