const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
mongoose.set("bufferCommands", false);

let mongoConnectionPromise = null;

async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI environment variable is missing");
    }

    if (!mongoConnectionPromise) {
        mongoConnectionPromise = mongoose
            .connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 10000
            })
            .then(() => {
                console.log("MongoDB Connected Successfully");
            })
            .catch((error) => {
                mongoConnectionPromise = null;
                console.error("MongoDB Connection Error:", error.message);
                throw error;
            });
    }

    await mongoConnectionPromise;
}

// Database middleware for API routes
app.use("/api", async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database connection failed:", error.message);

        res.status(503).json({
            message: "Database temporarily unavailable. Please try again."
        });
    }
});

// Import Routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Home Route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Health Check
app.get("/api/health", (req, res) => {
    res.json({
        message: "E-Commerce API is running!",
        database:
            mongoose.connection.readyState === 1
                ? "Connected"
                : "Disconnected"
    });
});

// Start Server
const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;