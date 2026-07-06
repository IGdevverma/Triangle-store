const productRoutes = require("./routes/productRoutes");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

// MongoDB Connection
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/products", productRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 Triangle Sports Backend Running");
});

// Server
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});