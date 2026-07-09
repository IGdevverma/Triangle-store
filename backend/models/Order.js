const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {

    customerName: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    address: {
      type: String,
      required: true
    },

    city: {
      type: String,
      required: true
    },

    state: {
      type: String,
      required: true
    },

    pincode: {
      type: String,
      required: true
    },

    paymentMethod: {
      type: String,
      default: "COD"
    },

    paymentStatus: {
      type: String,
      default: "Pending"
    },

    orderStatus: {
      type: String,
      enum: ["Pending", "Packed", "Shipped", "Delivered", "Cancelled"],
      default: "Processing"
    },

    items: [
      {
        productId: String,

        name: String,

        image: String,

        price: Number,

        quantity: Number
      }
    ],

    total: {
      type: Number,
      required: true
    }

  },

  {
    timestamps: true
  }

);

module.exports = mongoose.model("Order", orderSchema);