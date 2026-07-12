const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

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

    razorpayOrderId: {
      type: String,
      default: null
    },

    razorpayPaymentId: {
      type: String,
      default: null
    },

    paymentVerifiedAt: {
      type: Date,
      default: null
    },

    orderStatus: {
      type: String,
      enum: [
        "Processing",
        "Packed",
        "Shipped",
        "Delivered",
        "Cancelled"
      ],
      default: "Processing"
    },
    trackingHistory: [
      {
        status: {
          type: String
        },
        date: {
          type: Date,
          default: Date.now
        }
      }
    ],

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
