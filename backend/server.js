const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

// Config
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const quoteRoutes = require("./routes/quoteRoutes");

// Webhook
const { handleWebhook } = require("./controllers/paymentController");


// =====================================================
// DATABASE
// =====================================================

connectDB();


// =====================================================
// APP
// =====================================================

const app = express();


// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:4000",

  // Production domain — replace when ready
  // "https://trianglesports.in",
  // "https://www.trianglesports.in"
];

app.use(
  cors({
    origin: function (origin, callback) {

      // Allow requests without Origin
      // such as Postman/server-to-server
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ],

    credentials: true
  })
);


// =====================================================
// RAZORPAY WEBHOOK
// IMPORTANT:
// MUST COME BEFORE express.json()
// =====================================================

app.post(
  "/api/payment/webhook",
  express.raw({
    type: "application/json"
  }),
  handleWebhook
);


// =====================================================
// BODY PARSER
// =====================================================

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb"
  })
);


// =====================================================
// STATIC FILES
// =====================================================

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);


// =====================================================
// API ROUTES
// =====================================================

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/payment",
  paymentRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/quotes",
  quoteRoutes
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Triangle Sports API is running",
    environment: process.env.NODE_ENV || "development"
  });
});


// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {

  console.error("❌ API Error:", err.message);

  const statusCode =
    err.statusCode || 500;

  res.status(statusCode).json({
    success: false,

    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message
  });
});


// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {

  console.log(
    `🚀 Triangle Sports API running on port ${PORT}`
  );

  console.log(
    `🌍 Environment: ${
      process.env.NODE_ENV || "development"
    }`
  );
});


// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

process.on("SIGTERM", () => {

  console.log(
    "SIGTERM received. Shutting down..."
  );

  server.close(() => {

    console.log(
      "HTTP server closed."
    );

    process.exit(0);
  });
});