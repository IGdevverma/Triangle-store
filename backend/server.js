const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const adminRoutes = require("./routes/adminRoutes");



// ✅ Sabse pehle .env load karo
dotenv.config();
// Ab baaki imports
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { handleWebhook } = require("./controllers/paymentController");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");


// MongoDB Connection
connectDB();

const app = express();

// Middleware
app.use(cors());
// Razorpay signature validation needs the untouched request body, so this route
// must be registered before express.json().
app.post("/api/payment/webhook", express.raw({ type: "application/json" }), handleWebhook);
app.use(express.json());
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", adminRoutes);
// Test Route
app.get("/", (req, res) => {
  res.send("🚀 Triangle Sports Backend Running");
});

// Server
const PORT = process.env.PORT || 8000;
console.log("ORDER MODEL VERSION 2");
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

