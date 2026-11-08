import express from "express";
import jwt from "jsonwebtoken";
import Order from "../models/Order.js";

const router = express.Router();

// AUTHENTICATION MIDDLEWARE
const authGuard = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Please sign in first.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "pottery_secret_key"
    );

    req.userId = decoded.id;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Your session has expired. Please sign in again.",
    });
  }
};

// GET ORDER HISTORY
router.get("/", authGuard, async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Order history error:", error);

    res.status(500).json({
      message: "Unable to retrieve order history.",
    });
  }
});

// CREATE NEW ORDER
router.post("/", authGuard, async (req, res) => {
  try {
    const { items, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Your order must contain at least one product.",
      });
    }

    const validItems = items.every(
      (item) =>
        item.name &&
        Number(item.quantity) > 0 &&
        Number(item.price) >= 0
    );

    if (!validItems) {
      return res.status(400).json({
        message: "One or more order items are invalid.",
      });
    }

    if (!Number.isFinite(Number(total)) || Number(total) < 0) {
      return res.status(400).json({
        message: "Invalid order total.",
      });
    }

    const orderItems = items.map((item) => ({
      name: item.name,
      quantity: Number(item.quantity),
      pricePaid: Number(item.price),
    }));

    const newOrder = new Order({
      userId: req.userId,

      orderId: `DM-${Date.now()}-${Math.floor(
        100 + Math.random() * 900
      )}`,

      date: new Date().toLocaleDateString("en-KE"),

      items: orderItems,

      subtotal: Number(total),
    });

    await newOrder.save();

    res.status(201).json({
      message: "Order successfully placed.",
      orderId: newOrder.orderId,
      order: newOrder,
    });
  } catch (error) {
    console.error("Checkout error:", error);

    res.status(500).json({
      message: "Unable to process your order.",
    });
  }
});

export default router;
