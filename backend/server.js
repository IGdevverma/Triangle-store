const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");



// ✅ Sabse pehle .env load karo
dotenv.config();
console.log(process.env.RAZORPAY_KEY_ID);
// Ab baaki imports
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");


console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);
console.log(
  "API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "Loaded ✅" : "Missing ❌"
);

console.log("SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "Loaded ✅" : "Missing ❌");

// MongoDB Connection
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", require("./routes/authRoutes"));
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


