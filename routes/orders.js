const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const {
    authMiddleware,
    adminMiddleware
} = require("../middleware/authMiddleware");

const router = express.Router();

// POST: Place a new order
router.post("/", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { items, shippingAddress } = req.body;

        // Validate request
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Your cart is empty."
            });
        }

        if (items.length > 50) {
            return res.status(400).json({
                message: "Too many different products in one order."
            });
        }

        const requiredAddressFields = [
            "fullName",
            "phone",
            "address",
            "city",
            "pincode"
        ];

        if (
            !shippingAddress ||
            requiredAddressFields.some(
                field =>
                    typeof shippingAddress[field] !== "string" ||
                    !shippingAddress[field].trim()
            )
        ) {
            return res.status(400).json({
                message: "Please provide complete shipping details."
            });
        }

        if (!/^[0-9]{10}$/.test(shippingAddress.phone.trim())) {
            return res.status(400).json({
                message: "Enter a valid 10-digit phone number."
            });
        }

        if (!/^[0-9]{6}$/.test(shippingAddress.pincode.trim())) {
            return res.status(400).json({
                message: "Enter a valid 6-digit PIN code."
            });
        }

        // Validate product IDs and quantities.
        const quantities = new Map();

        for (const item of items) {
            if (
                !item ||
                typeof item.productId !== "string" ||
                !mongoose.isValidObjectId(item.productId) ||
                !Number.isSafeInteger(item.quantity) ||
                item.quantity < 1 ||
                item.quantity > 100
            ) {
                return res.status(400).json({
                    message: "Invalid product or quantity."
                });
            }

            const id = item.productId;
            quantities.set(id, (quantities.get(id) || 0) + item.quantity);

            if (quantities.get(id) > 100) {
                return res.status(400).json({
                    message: "Maximum quantity per product is 100."
                });
            }
        }

        let createdOrder;

        // Use a transaction so stock changes and order creation
        // succeed or fail together.
        await session.withTransaction(async () => {
            const orderItems = [];
            let totalAmount = 0;

            for (const [productId, quantity] of quantities) {
                const product = await Product.findOneAndUpdate(
                    {
                        _id: productId,
                        stock: { $gte: quantity }
                    },
                    {
                        $inc: { stock: -quantity }
                    },
                    {
                        new: true,
                        session
                    }
                );

                if (!product) {
                    throw new Error(
                        `Product ${productId} is unavailable or has insufficient stock.`
                    );
                }

                const lineTotal = product.price * quantity;
                totalAmount += lineTotal;

                orderItems.push({
                    product: product._id,
                    name: product.name,
                    price: product.price,
                    quantity
                });
            }

            createdOrder = new Order({
                user: req.userId,
                items: orderItems,
                totalAmount: Number(totalAmount.toFixed(2)),
                shippingAddress: {
                    fullName: shippingAddress.fullName.trim(),
                    phone: shippingAddress.phone.trim(),
                    address: shippingAddress.address.trim(),
                    city: shippingAddress.city.trim(),
                    pincode: shippingAddress.pincode.trim()
                },
                status: "Pending"
            });

            await createdOrder.save({ session });
        });

        return res.status(201).json({
            message: "Order placed successfully!",
            order: createdOrder
        });

    } catch (error) {
        console.error("Place order error:", error.message);

        if (error.message.includes("insufficient stock") ||
            error.message.includes("unavailable")) {
            return res.status(409).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Unable to place order. Please try again."
        });

    } finally {
        await session.endSession();
    }
});


// GET: Customer sees their own orders.
// Admin can see all orders.
router.get("/", authMiddleware, async (req, res) => {
    try {
        const filter = req.userRole === "admin"
            ? {}
            : { user: req.userId };

        const orders = await Order.find(filter)
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        res.json(orders);

    } catch (error) {
        console.error("Fetch orders error:", error.message);

        res.status(500).json({
            message: "Unable to fetch orders."
        });
    }
});


// PATCH: Admin updates an order's status.
router.patch(
    "/:id/status",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const { status } = req.body;

            const allowedStatuses = [
                "Pending",
                "Confirmed",
                "Shipped",
                "Delivered",
                "Cancelled"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid order status."
                });
            }

            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid order ID."
                });
            }

            const order = await Order.findByIdAndUpdate(
                req.params.id,
                { status },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!order) {
                return res.status(404).json({
                    message: "Order not found."
                });
            }

            res.json({
                message: "Order status updated successfully.",
                order
            });

        } catch (error) {
            console.error("Update order status error:", error.message);

            res.status(500).json({
                message: "Unable to update order status."
            });
        }
    }
);

module.exports = router;