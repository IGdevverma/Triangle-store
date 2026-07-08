const productRoutes = require("./routes/productRoutes");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");

dotenv.config();

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
app.use("/uploads", express.static("uploads"));

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 Triangle Sports Backend Running");
});

// Server
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
const path = require("path");

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);