const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER
    // ==========================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // ==========================================
    // CUSTOMER DETAILS
    // ==========================================

    customerName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    // ==========================================
    // DELIVERY ADDRESS
    // ==========================================

    address: {
      type: String,
      required: true,
      trim: true
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    state: {
      type: String,
      required: true,
      trim: true
    },

    pincode: {
      type: String,
      required: true,
      trim: true
    },

    // ==========================================
    // PAYMENT
    // ==========================================

    paymentMethod: {
      type: String,
      enum: [
        "UPI",
        "CARD",
        "NETBANKING",
        "WALLET"
      ],
      required: true
    },

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Refunded"
      ],
      default: "Pending",
      index: true
    },

    // Razorpay Order ID
    razorpayOrderId: {
      type: String,
      default: null,
      unique: true,
      sparse: true
    },

    // Razorpay Payment ID
    razorpayPaymentId: {
      type: String,
      default: null
    },

    // Time when payment was verified
    paymentVerifiedAt: {
      type: Date,
      default: null
    },

    // ==========================================
    // RAZORPAY WEBHOOK IDEMPOTENCY
    // ==========================================

    processedWebhookEvents: {
      type: [String],
      default: []
    },

    // ==========================================
    // ORDER STATUS
    // ==========================================

    orderStatus: {
      type: String,
      enum: [
        "Processing",
        "Packed",
        "Shipped",
        "Delivered",
        "Cancelled"
      ],
      default: "Processing",
      index: true
    },

    // ==========================================
    // TRACKING HISTORY
    // ==========================================

    trackingHistory: [
      {
        status: {
          type: String,
          enum: [
            "Processing",
            "Packed",
            "Shipped",
            "Delivered",
            "Cancelled"
          ],
          required: true
        },

        date: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // ==========================================
    // ORDER ITEMS
    // ==========================================

    items: [
      {
        productId: {
          type: String,
          required: true
        },

        name: {
          type: String,
          required: true
        },

        image: {
          type: String,
          default: ""
        },

        price: {
          type: Number,
          required: true,
          min: 0
        },

        quantity: {
          type: Number,
          required: true,
          min: 1
        }
      }
    ],

    // ==========================================
    // TOTAL
    // ==========================================

    total: {
      type: Number,
      required: true,
      min: 0
    }
  },

  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);