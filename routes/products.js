const express = require("express");
const Product = require("../models/Product");

const {
    authMiddleware,
    adminMiddleware
} = require("../middleware/authMiddleware");

const router = express.Router();

// GET ALL PRODUCTS - Public
router.get("/", async (req, res) => {
    try {
        const products = await Product.find().sort({
            createdAt: -1
        });

        res.json(products);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch products."
        });
    }
});

// GET SINGLE PRODUCT - Public
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.json(product);
    } catch (error) {
        res.status(400).json({
            message: "Invalid product ID."
        });
    }
});

// ADD PRODUCT - Admin Only
router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const {
                name,
                description,
                price,
                image,
                category,
                stock
            } = req.body;

            if (
                !name ||
                !description ||
                price === undefined ||
                !category
            ) {
                return res.status(400).json({
                    message: "Name, description, price and category are required."
                });
            }

            const product = await Product.create({
                name,
                description,
                price,
                image,
                category,
                stock
            });

            res.status(201).json({
                message: "Product added successfully.",
                product
            });
        } catch (error) {
            res.status(400).json({
                message: "Failed to add product."
            });
        }
    }
);

// UPDATE PRODUCT - Admin Only
router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const allowedFields = [
                "name",
                "description",
                "price",
                "image",
                "category",
                "stock"
            ];

            const updates = {};

            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            }

            const product = await Product.findByIdAndUpdate(
                req.params.id,
                updates,
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!product) {
                return res.status(404).json({
                    message: "Product not found."
                });
            }

            res.json({
                message: "Product updated successfully.",
                product
            });
        } catch (error) {
            res.status(400).json({
                message: "Failed to update product."
            });
        }
    }
);

// DELETE PRODUCT - Admin Only
router.delete(
    "/:id",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const product = await Product.findByIdAndDelete(
                req.params.id
            );

            if (!product) {
                return res.status(404).json({
                    message: "Product not found."
                });
            }

            res.json({
                message: "Product deleted successfully."
            });
        } catch (error) {
            res.status(400).json({
                message: "Failed to delete product."
            });
        }
    }
);

module.exports = router;